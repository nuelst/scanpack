import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ReadDependenciesUseCase } from '../../src/application/use-cases/read-dependencies.use-case.js';
import type { Dependency, PackageJson } from '../../src/domain/entities.js';
import type { PackageReaderPort } from '../../src/domain/ports.js';

describe('ReadDependenciesUseCase', () => {
  const mockPackageReader: PackageReaderPort = {
    readPackageJson: vi.fn(),
    extractDependencies: vi.fn()
  };

  const useCase = new ReadDependenciesUseCase(mockPackageReader);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read and extract dependencies', async () => {
    const mockPackageJson: PackageJson = {
      dependencies: { react: '^18.0.0' },
      devDependencies: { typescript: '^5.0.0' }
    };

    const mockDependencies: Dependency[] = [
      { name: 'react', version: '^18.0.0', type: 'dependency' },
      { name: 'typescript', version: '^5.0.0', type: 'devDependency' }
    ];

    vi.mocked(mockPackageReader.readPackageJson).mockResolvedValue(mockPackageJson);
    vi.mocked(mockPackageReader.extractDependencies).mockReturnValue(mockDependencies);

    const result = await useCase.execute('/test/path');

    expect(result).toEqual(mockDependencies);
    expect(mockPackageReader.readPackageJson).toHaveBeenCalledWith('/test/path');
    expect(mockPackageReader.extractDependencies).toHaveBeenCalledWith(mockPackageJson);
  });
});

