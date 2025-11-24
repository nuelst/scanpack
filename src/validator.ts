import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { DependencyInfo, ValidationReport, ValidationResult } from './types.js';

interface MaliciousPackage {
  name: string;
  reason: string;
  severity: string;
}

interface MaliciousPattern {
  pattern: string;
  reason: string;
  severity: string;
}

interface MaliciousPackagesConfig {
  packages: MaliciousPackage[];
  patterns: MaliciousPattern[];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const maliciousPackagesPath = join(__dirname, 'malicious-packages.json');
const maliciousPackages: MaliciousPackagesConfig = JSON.parse(readFileSync(maliciousPackagesPath, 'utf-8'));

export class DependencyValidator {

  static async checkNpmPackage(packageName: string): Promise<{ exists: boolean; url?: string }> {
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);

      if (response.ok) {
        return {
          exists: true,
          url: `https://www.npmjs.com/package/${packageName}`
        };
      }

      if (response.status === 404) {
        return { exists: false };
      }

      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
  }


  static isKnownMalicious(packageName: string): { isMalicious: boolean; reason?: string; severity?: string } {
    const maliciousPackage = maliciousPackages.packages.find(
      pkg => pkg.name.toLowerCase() === packageName.toLowerCase()
    );

    if (maliciousPackage) {
      return {
        isMalicious: true,
        reason: maliciousPackage.reason,
        severity: maliciousPackage.severity
      };
    }

    for (const pattern of maliciousPackages.patterns) {
      const regex = new RegExp(pattern.pattern, 'i');
      if (regex.test(packageName)) {
        return {
          isMalicious: true,
          reason: pattern.reason,
          severity: pattern.severity
        };
      }
    }

    return { isMalicious: false };
  }


  static async validateDependency(dependency: DependencyInfo): Promise<ValidationResult> {
    const npmCheck = await this.checkNpmPackage(dependency.name);
    const maliciousCheck = this.isKnownMalicious(dependency.name);

    const isValid = npmCheck.exists && !maliciousCheck.isMalicious;
    const isUnknown = !npmCheck.exists && !maliciousCheck.isMalicious;

    return {
      dependency,
      isValid,
      existsOnNpm: npmCheck.exists,
      isKnownMalicious: maliciousCheck.isMalicious,
      reason: maliciousCheck.reason || (isUnknown ? 'Package not found on npm' : undefined),
      npmUrl: npmCheck.url
    };
  }


  static async validateDependencies(dependencies: DependencyInfo[]): Promise<ValidationReport> {
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
    const maliciousDependencies = results.filter(r => r.isKnownMalicious).length;
    const unknownDependencies = results.filter(r => !r.existsOnNpm && !r.isKnownMalicious).length;

    return {
      totalDependencies: dependencies.length,
      validDependencies,
      invalidDependencies,
      maliciousDependencies,
      unknownDependencies,
      results
    };
  }
}

