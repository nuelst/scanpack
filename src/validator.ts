import { MaliciousPackageRepositoryAdapter } from './infrastructure/adapters/malicious-package.repository.adapter.js';
import { NpmRegistryAdapter } from './infrastructure/adapters/npm-registry.adapter.js';
import { validateDependenciesUseCase } from './infrastructure/container.js';
import type { DependencyInfo, ValidationReport, ValidationResult } from './types.js';

const npmRegistry = new NpmRegistryAdapter();
const maliciousRepository = new MaliciousPackageRepositoryAdapter();

export class DependencyValidator {
  static async checkNpmPackage(packageName: string): Promise<{ exists: boolean; url?: string; isSecurityHolding?: boolean }> {
    return await npmRegistry.checkPackage(packageName);
  }

  static isKnownMalicious(packageName: string): { isMalicious: boolean; reason?: string; severity?: string } {
    return maliciousRepository.isKnownMalicious(packageName);
  }

  static async validateDependency(dependency: DependencyInfo): Promise<ValidationResult> {
    const npmCheck = await this.checkNpmPackage(dependency.name);
    const maliciousCheck = this.isKnownMalicious(dependency.name);
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

  static async validateDependencies(dependencies: DependencyInfo[]): Promise<ValidationReport> {
    return await validateDependenciesUseCase.execute(dependencies);
  }
}

