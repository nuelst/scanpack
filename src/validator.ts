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

  static async checkNpmPackage(packageName: string): Promise<{ exists: boolean; url?: string; isSecurityHolding?: boolean }> {
    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);

      if (response.ok) {
        const data = await response.json() as { 'dist-tags'?: { latest?: string } };
        const latestVersion = data['dist-tags']?.latest;
        const isSecurityHolding = latestVersion === '0.0.1-security' || latestVersion?.endsWith('-security');

        return {
          exists: true,
          url: `https://www.npmjs.com/package/${packageName}`,
          isSecurityHolding
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
    const isSecurityHolding = npmCheck.isSecurityHolding || false;

    // Security holding packages are considered malicious
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
}

