import type { Dependency, ValidationOptions, ValidationReport, ValidationResult, Vulnerability } from '../../domain/entities.js';
import type { LockFileReaderPort, MaliciousPackageRepositoryPort, NpmAuditPort, NpmRegistryPort } from '../../domain/ports.js';

export class ValidateDependenciesUseCase {
  constructor(
    private readonly npmRegistry: NpmRegistryPort,
    private readonly maliciousPackageRepository: MaliciousPackageRepositoryPort,
    private readonly npmAudit?: NpmAuditPort,
    private readonly lockFileReader?: LockFileReaderPort
  ) { }

  async execute(dependencies: Dependency[], options?: ValidationOptions, projectPath?: string): Promise<ValidationReport> {
    const results: ValidationResult[] = [];
    let allDependencies = [...dependencies];

    // Include transitive dependencies if requested
    if (options?.includeTransitive && this.lockFileReader && projectPath) {
      try {
        const transitiveDeps = await this.lockFileReader.readLockFile(projectPath);
        // Merge with existing dependencies, avoiding duplicates
        const existingNames = new Set(dependencies.map(d => d.name.toLowerCase()));
        const newDeps = transitiveDeps.filter(d => !existingNames.has(d.name.toLowerCase()));
        allDependencies = [...dependencies, ...newDeps];
      } catch (error) {
        // If lock file reading fails, continue with direct dependencies only
      }
    }

    // Filter ignored dependencies
    const ignoreSet = new Set(options?.ignore?.map(name => name.toLowerCase()) || []);
    const filteredDependencies = allDependencies.filter(
      dep => !ignoreSet.has(dep.name.toLowerCase())
    );

    // Dynamic batch size based on latency
    let batchSize = options?.batchSize || 10;
    const minBatchSize = 5;
    const maxBatchSize = 50;

    for (let i = 0; i < filteredDependencies.length; i += batchSize) {
      const batchStart = Date.now();
      const batch = filteredDependencies.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(dep => this.validateDependency(dep, options?.checkOutdated))
      );

      results.push(...batchResults);

      // Calculate latency and adjust batch size
      const batchLatency = Date.now() - batchStart;

      // Adjust batch size: if fast, increase; if slow, decrease
      if (batchLatency < 500 && batchSize < maxBatchSize) {
        batchSize = Math.min(batchSize + 5, maxBatchSize);
      } else if (batchLatency > 2000 && batchSize > minBatchSize) {
        batchSize = Math.max(batchSize - 5, minBatchSize);
      }

      // Progress callback
      if (options?.onProgress) {
        options.onProgress(results.length, filteredDependencies.length);
      }
    }

    // Run npm audit if requested
    let vulnerabilities: Vulnerability[] = [];
    let auditSummary;
    if (options?.includeAudit && this.npmAudit && projectPath) {
      try {
        const auditResult = await this.npmAudit.runAudit(projectPath);
        vulnerabilities = auditResult.vulnerabilities;
        auditSummary = auditResult.summary;

        // Map vulnerabilities to results
        const vulnMap = new Map<string, Vulnerability[]>();
        for (const vuln of vulnerabilities) {
          if (!vulnMap.has(vuln.package)) {
            vulnMap.set(vuln.package, []);
          }
          vulnMap.get(vuln.package)!.push(vuln);
        }

        // Add vulnerabilities to matching results
        for (const result of results) {
          const packageVulns = vulnMap.get(result.dependency.name);
          if (packageVulns) {
            result.vulnerabilities = packageVulns;
          }
        }
      } catch (error) {
        // If audit fails, continue without audit data
      }
    }

    const validDependencies = results.filter(r => r.isValid).length;
    const invalidDependencies = results.filter(r => !r.isValid).length;
    const maliciousDependencies = results.filter(r => r.isKnownMalicious || r.isSecurityHolding).length;
    const unknownDependencies = results.filter(r => !r.existsOnNpm && !r.isKnownMalicious && !r.isSecurityHolding).length;

    return {
      totalDependencies: allDependencies.length,
      validDependencies,
      invalidDependencies,
      maliciousDependencies,
      unknownDependencies,
      results,
      vulnerabilities: vulnerabilities.length > 0 ? vulnerabilities : undefined,
      auditSummary
    };
  }

  private async validateDependency(dependency: Dependency, checkOutdated = false): Promise<ValidationResult> {
    const npmCheck = await this.npmRegistry.checkPackage(dependency.name);
    const maliciousCheck = this.maliciousPackageRepository.isKnownMalicious(dependency.name);
    const isSecurityHolding = npmCheck.isSecurityHolding || false;

    const isMalicious = maliciousCheck.isMalicious || isSecurityHolding;
    const isValid = npmCheck.exists && !isMalicious;
    const isUnknown = !npmCheck.exists && !isMalicious;

    // Check if outdated
    let isOutdated = false;
    if (checkOutdated && npmCheck.latestVersion && npmCheck.exists) {
      // Simple version comparison (can be improved with semver library)
      isOutdated = npmCheck.latestVersion !== dependency.version &&
        npmCheck.latestVersion !== `^${dependency.version}` &&
        npmCheck.latestVersion !== `~${dependency.version}`;
    }

    let reason = maliciousCheck.reason;
    if (isSecurityHolding && !maliciousCheck.isMalicious) {
      reason = 'Security holding package - original package was removed by npm for security reasons';
    } else if (isUnknown) {
      reason = 'Package not found on npm';
    } else if (isOutdated) {
      reason = `Package is outdated. Latest version: ${npmCheck.latestVersion}`;
    }

    return {
      dependency,
      isValid,
      existsOnNpm: npmCheck.exists,
      isKnownMalicious: isMalicious,
      isSecurityHolding,
      reason,
      npmUrl: npmCheck.url,
      latestVersion: npmCheck.latestVersion,
      isOutdated: checkOutdated ? isOutdated : undefined
    };
  }
}

