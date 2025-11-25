import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MaliciousPackageRepositoryError } from '../../domain/errors.js';
import type { MaliciousPackageRepositoryPort } from '../../domain/ports.js';

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

export class MaliciousPackageRepositoryAdapter implements MaliciousPackageRepositoryPort {
  private readonly maliciousPackages: MaliciousPackagesConfig;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    // In dist, malicious-packages.json is in the same directory
    const maliciousPackagesPath = join(__dirname, '../../malicious-packages.json');
    try {
      this.maliciousPackages = JSON.parse(readFileSync(maliciousPackagesPath, 'utf-8'));
    } catch (error) {
      // Fallback for dist directory
      try {
        const distPath = join(__dirname, '../malicious-packages.json');
        this.maliciousPackages = JSON.parse(readFileSync(distPath, 'utf-8'));
      } catch (fallbackError) {
        const cause = fallbackError instanceof Error
          ? fallbackError
          : error instanceof Error
            ? error
            : undefined;
        throw new MaliciousPackageRepositoryError(
          'Failed to load malicious packages list',
          cause
        );
      }
    }
  }

  isKnownMalicious(packageName: string): {
    isMalicious: boolean;
    reason?: string;
    severity?: string;
  } {
    // Check in direct list
    const maliciousPackage = this.maliciousPackages.packages.find(
      pkg => pkg.name.toLowerCase() === packageName.toLowerCase()
    );

    if (maliciousPackage) {
      return {
        isMalicious: true,
        reason: maliciousPackage.reason,
        severity: maliciousPackage.severity
      };
    }

    // Check suspicious patterns
    for (const pattern of this.maliciousPackages.patterns) {
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
}

