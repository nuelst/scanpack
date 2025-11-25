import type { Dependency, ValidationOptions, ValidationReport, ValidationResult } from '../../domain/entities.js';
import type { MaliciousPackageRepositoryPort, NpmRegistryPort } from '../../domain/ports.js';

export class ValidateDependenciesUseCase {
  constructor(
    private readonly npmRegistry: NpmRegistryPort,
    private readonly maliciousPackageRepository: MaliciousPackageRepositoryPort
  ) { }

  async execute(dependencies: Dependency[], options?: ValidationOptions): Promise<ValidationReport> {
    const results: ValidationResult[] = [];

    // Filter ignored dependencies
    const ignoreSet = new Set(options?.ignore?.map(name => name.toLowerCase()) || []);
    const filteredDependencies = dependencies.filter(
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
        batch.map(dep => this.validateDependency(dep))
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

    const validDependencies = results.filter(r => r.isValid).length;
    const invalidDependencies = results.filter(r => !r.isValid).length;
    const maliciousDependencies = results.filter(r => r.isKnownMalicious || r.isSecurityHolding).length;
    const unknownDependencies = results.filter(r => !r.existsOnNpm && !r.isKnownMalicious && !r.isSecurityHolding).length;

    return {
      totalDependencies: dependencies.length,
      validDependencies,
      invalidDependencies,
      maliciousDependencies,
      unknownDependencies,
      results
    };
  }

  private async validateDependency(dependency: Dependency): Promise<ValidationResult> {
    const npmCheck = await this.npmRegistry.checkPackage(dependency.name);
    const maliciousCheck = this.maliciousPackageRepository.isKnownMalicious(dependency.name);
    const isSecurityHolding = npmCheck.isSecurityHolding || false;

    const isMalicious = maliciousCheck.isMalicious || isSecurityHolding;
    const isValid = npmCheck.exists && !isMalicious;
    const isUnknown = !npmCheck.exists && !isMalicious;

    let reason = maliciousCheck.reason;
    if (isSecurityHolding && !maliciousCheck.isMalicious) {
      reason = 'Security holding package - original package was removed by npm for security reasons';
    } else if (isUnknown) {
      reason = 'Package not found on npm';
    }

    return {
      dependency,
      isValid,
      existsOnNpm: npmCheck.exists,
      isKnownMalicious: isMalicious,
      isSecurityHolding,
      reason,
      npmUrl: npmCheck.url
    };
  }
}

