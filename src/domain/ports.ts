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
  }>;
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
