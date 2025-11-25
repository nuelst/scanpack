
import { ReadDependenciesUseCase } from '../application/use-cases/read-dependencies.use-case.js';
import { ValidateDependenciesUseCase } from '../application/use-cases/validate-dependencies.use-case.js';
import { FileSystemAdapter } from './adapters/file-system.adapter.js';
import { LoggerAdapter } from './adapters/logger.adapter.js';
import { MaliciousPackageRepositoryAdapter } from './adapters/malicious-package.repository.adapter.js';
import { NpmRegistryAdapter } from './adapters/npm-registry.adapter.js';
import { PackageReaderAdapter } from './adapters/package-reader.adapter.js';

const logger = new LoggerAdapter();
const fileSystem = new FileSystemAdapter();
const npmRegistry = new NpmRegistryAdapter();
const maliciousPackageRepository = new MaliciousPackageRepositoryAdapter();
const packageReader = new PackageReaderAdapter(fileSystem);

export const readDependenciesUseCase = new ReadDependenciesUseCase(packageReader);
export const validateDependenciesUseCase = new ValidateDependenciesUseCase(
  npmRegistry,
  maliciousPackageRepository
);

export { logger };

