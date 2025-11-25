export interface Dependency {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency' | 'peerDependency' | 'optionalDependency';
}

export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface ValidationResult {
  dependency: Dependency;
  isValid: boolean;
  existsOnNpm: boolean;
  isKnownMalicious: boolean;
  isSecurityHolding?: boolean;
  reason?: string;
  npmUrl?: string;
}

export interface ValidationReport {
  totalDependencies: number;
  validDependencies: number;
  invalidDependencies: number;
  maliciousDependencies: number;
  unknownDependencies: number;
  results: ValidationResult[];
}

export interface MaliciousPackage {
  name: string;
  reason: string;
  severity: string;
}

export interface MaliciousPattern {
  pattern: string;
  reason: string;
  severity: string;
}

export interface MaliciousPackagesConfig {
  packages: MaliciousPackage[];
  patterns: MaliciousPattern[];
}

export interface ValidationOptions {
  ignore?: string[];
  rateLimit?: number;
  batchSize?: number;
  onProgress?: (current: number, total: number) => void;
}
