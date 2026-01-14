export type {
  AuditSummary,
  Dependency,
  PackageJson,
  ValidationReport,
  ValidationResult,
  Vulnerability
} from './domain/entities.js';

export {
  MaliciousPackageRepositoryError, NpmRegistryError, PackageJsonParseError, PackageJsonReadError, ScanPackError
} from './domain/errors.js';

export type {
  FileSystemPort,
  LockFileReaderPort,
  LoggerPort,
  MaliciousPackageRepositoryPort,
  NpmAuditPort,
  NpmRegistryPort,
  PackageReaderPort
} from './domain/ports.js';

export { ReadDependenciesUseCase } from './application/use-cases/read-dependencies.use-case.js';
export { ValidateDependenciesUseCase } from './application/use-cases/validate-dependencies.use-case.js';

export { FileSystemAdapter } from './infrastructure/adapters/file-system.adapter.js';
export { LockFileReaderAdapter } from './infrastructure/adapters/lock-file-reader.adapter.js';
export { LoggerAdapter } from './infrastructure/adapters/logger.adapter.js';
export { MaliciousPackageRepositoryAdapter } from './infrastructure/adapters/malicious-package.repository.adapter.js';
export { NpmAuditAdapter } from './infrastructure/adapters/npm-audit.adapter.js';
export { NpmRegistryAdapter } from './infrastructure/adapters/npm-registry.adapter.js';
export { PackageReaderAdapter } from './infrastructure/adapters/package-reader.adapter.js';

export {
  readDependenciesUseCase,
  validateDependenciesUseCase
} from './infrastructure/container.js';

export { PackageReader } from './package-reader.js';
export * from './types.js';
export { DependencyValidator } from './validator.js';

