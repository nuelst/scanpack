
import { ReadDependenciesUseCase } from '../application/use-cases/read-dependencies.use-case.js';
import { ValidateDependenciesUseCase } from '../application/use-cases/validate-dependencies.use-case.js';
import { FileSystemAdapter } from './adapters/file-system.adapter.js';
import { LockFileReaderAdapter } from './adapters/lock-file-reader.adapter.js';
import { LoggerAdapter } from './adapters/logger.adapter.js';
import { MaliciousPackageRepositoryAdapter } from './adapters/malicious-package.repository.adapter.js';
import { NpmAuditAdapter } from './adapters/npm-audit.adapter.js';
import { NpmRegistryAdapter } from './adapters/npm-registry.adapter.js';
import { PackageReaderAdapter } from './adapters/package-reader.adapter.js';
import { RateLimiterAdapter } from './adapters/rate-limiter.adapter.js';

const logger = new LoggerAdapter();
const fileSystem = new FileSystemAdapter();
const maliciousPackageRepository = new MaliciousPackageRepositoryAdapter();
const packageReader = new PackageReaderAdapter(fileSystem);
const lockFileReader = new LockFileReaderAdapter(fileSystem);
const npmAudit = new NpmAuditAdapter();

// Rate limiter and npm registry are created per-use to allow configuration
export const createNpmRegistry = (rateLimit?: number, enableCache = true) => {
  const rateLimiter = rateLimit ? new RateLimiterAdapter(rateLimit) : undefined;
  return new NpmRegistryAdapter(rateLimiter, enableCache);
};

export const createValidateDependenciesUseCase = (
  rateLimit?: number,
  includeAudit = false,
  includeTransitive = false
) => {
  const npmRegistry = createNpmRegistry(rateLimit);
  return new ValidateDependenciesUseCase(
    npmRegistry,
    maliciousPackageRepository,
    includeAudit ? npmAudit : undefined,
    includeTransitive ? lockFileReader : undefined
  );
};

// Default instances (no rate limiting)
const npmRegistry = new NpmRegistryAdapter();
export const readDependenciesUseCase = new ReadDependenciesUseCase(packageReader);
export const validateDependenciesUseCase = new ValidateDependenciesUseCase(
  npmRegistry,
  maliciousPackageRepository
);

export { lockFileReader, logger, npmAudit };

