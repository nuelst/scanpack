import type { Dependency, ValidationReport, ValidationResult } from '../../domain/entities.js';
import type { MaliciousPackageRepositoryPort, NpmRegistryPort } from '../../domain/ports.js';

export class ValidateDependenciesUseCase {
  constructor(
    private readonly npmRegistry: NpmRegistryPort,
    private readonly maliciousPackageRepository: MaliciousPackageRepositoryPort
  ) { }

  async execute(dependencies: Dependency[]): Promise<ValidationReport> {
    const results: ValidationResult[] = [];

    const batchSize = 10;
    for (let i = 0; i < dependencies.length; i += batchSize) {
      const batch = dependencies.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(dep => this.validateDependency(dep))
      );
      results.push(...batchResults);
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

