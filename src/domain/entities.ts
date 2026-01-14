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

export interface Vulnerability {
  id: string;
  title: string;
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'info';
  package: string;
  patchedVersions?: string;
  url?: string;
}

export interface ValidationResult {
  dependency: Dependency;
  isValid: boolean;
  existsOnNpm: boolean;
  isKnownMalicious: boolean;
  isSecurityHolding?: boolean;
  reason?: string;
  npmUrl?: string;
  vulnerabilities?: Vulnerability[];
  latestVersion?: string;
  isOutdated?: boolean;
}

export interface AuditSummary {
  total: number;
  critical: number;
  high: number;
  moderate: number;
  low: number;
  info: number;
}

export interface ValidationReport {
  totalDependencies: number;
  validDependencies: number;
  invalidDependencies: number;
  maliciousDependencies: number;
  unknownDependencies: number;
  results: ValidationResult[];
  vulnerabilities?: Vulnerability[];
  auditSummary?: AuditSummary;
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
  includeAudit?: boolean;
  includeTransitive?: boolean;
  checkOutdated?: boolean;
}
