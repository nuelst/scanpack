import type { Dependency, PackageJson } from './entities.js';

/**
 * Port for logging
 */
export interface LoggerPort {
  info(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  debug(message: string, ...args: unknown[]): void;
}

/**
 * Port for rate limiting
 */
export interface RateLimiterPort {
  wait(): Promise<void>;
  reset(): void;
}

/**
 * Port for reading files from filesystem
 */
export interface FileSystemPort {
  readFile(path: string): Promise<string>;
  readFileSync(path: string): string;
}

/**
 * Port for checking packages on npm registry
 */
export interface NpmRegistryPort {
  checkPackage(packageName: string): Promise<{
    exists: boolean;
    url?: string;
    isSecurityHolding?: boolean;
    latestVersion?: string;
  }>;
}

/**
 * Port for running npm audit
 */
export interface NpmAuditPort {
  runAudit(projectPath: string): Promise<{
    vulnerabilities: Array<{
      id: string;
      title: string;
      severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
      package: string;
      patchedVersions?: string;
      url?: string;
    }>;
    summary: {
      total: number;
      critical: number;
      high: number;
      moderate: number;
      low: number;
      info: number;
    };
  }>;
}

/**
 * Port for reading lock files
 */
export interface LockFileReaderPort {
  readLockFile(projectPath: string): Promise<Dependency[]>;
  hasLockFile(projectPath: string): boolean;
}

/**
 * Port for checking malicious packages
 */
export interface MaliciousPackageRepositoryPort {
  isKnownMalicious(packageName: string): {
    isMalicious: boolean;
    reason?: string;
    severity?: string;
  };
}

/**
 * Port for reading package.json
 */
export interface PackageReaderPort {
  readPackageJson(projectPath: string): Promise<PackageJson>;
  extractDependencies(packageJson: PackageJson): Dependency[];
}

// Re-export utility function for convenience
export { extractDependencies } from './utils.js';
