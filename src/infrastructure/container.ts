
import { ReadDependenciesUseCase } from '../application/use-cases/read-dependencies.use-case.js';
import { ValidateDependenciesUseCase } from '../application/use-cases/validate-dependencies.use-case.js';
import { FileSystemAdapter } from './adapters/file-system.adapter.js';
import { LoggerAdapter } from './adapters/logger.adapter.js';
import { MaliciousPackageRepositoryAdapter } from './adapters/malicious-package.repository.adapter.js';
import { NpmRegistryAdapter } from './adapters/npm-registry.adapter.js';
import { PackageReaderAdapter } from './adapters/package-reader.adapter.js';
import { RateLimiterAdapter } from './adapters/rate-limiter.adapter.js';

const logger = new LoggerAdapter();
const fileSystem = new FileSystemAdapter();
const maliciousPackageRepository = new MaliciousPackageRepositoryAdapter();
const packageReader = new PackageReaderAdapter(fileSystem);

// Rate limiter and npm registry are created per-use to allow configuration
export const createNpmRegistry = (rateLimit?: number) => {
  const rateLimiter = rateLimit ? new RateLimiterAdapter(rateLimit) : undefined;
  return new NpmRegistryAdapter(rateLimiter);
};

export const createValidateDependenciesUseCase = (rateLimit?: number) => {
  const npmRegistry = createNpmRegistry(rateLimit);
  return new ValidateDependenciesUseCase(npmRegistry, maliciousPackageRepository);
};

// Default instances (no rate limiting)
const npmRegistry = new NpmRegistryAdapter();
export const readDependenciesUseCase = new ReadDependenciesUseCase(packageReader);
export const validateDependenciesUseCase = new ValidateDependenciesUseCase(
  npmRegistry,
  maliciousPackageRepository
);

export { logger };

