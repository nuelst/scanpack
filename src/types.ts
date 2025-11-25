export interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export interface DependencyInfo {
  name: string;
  version: string;
  type: 'dependency' | 'devDependency' | 'peerDependency' | 'optionalDependency';
}

export interface ValidationResult {
  dependency: DependencyInfo;
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

