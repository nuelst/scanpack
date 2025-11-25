import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ValidateDependenciesUseCase } from '../../src/application/use-cases/validate-dependencies.use-case.js';
import type { Dependency } from '../../src/domain/entities.js';
import { MaliciousPackageRepositoryAdapter } from '../../src/infrastructure/adapters/malicious-package.repository.adapter.js';
import { NpmRegistryAdapter } from '../../src/infrastructure/adapters/npm-registry.adapter.js';

// Mock fetch
globalThis.fetch = vi.fn() as typeof fetch;

describe('ValidateDependenciesUseCase', () => {
  const npmRegistry = new NpmRegistryAdapter();
  const maliciousRepository = new MaliciousPackageRepositoryAdapter();
  const useCase = new ValidateDependenciesUseCase(npmRegistry, maliciousRepository);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('execute', () => {
    it('should validate valid package', async () => {
      const dependencies: Dependency[] = [
        { name: 'react', version: '^18.0.0', type: 'dependency' }
      ];

      const mockResponse = {
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '18.2.0' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await useCase.execute(dependencies);

      expect(result.totalDependencies).toBe(1);
      expect(result.validDependencies).toBe(1);
      expect(result.invalidDependencies).toBe(0);
    });

    it('should detect malicious package', async () => {
      const dependencies: Dependency[] = [
        { name: 'xdater', version: '^6.2.0', type: 'dependency' }
      ];

      const mockResponse = {
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '0.0.1-security' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await useCase.execute(dependencies);

      expect(result.totalDependencies).toBe(1);
      expect(result.invalidDependencies).toBe(1);
      expect(result.maliciousDependencies).toBe(1);
    });

    it('should detect unknown package', async () => {
      const dependencies: Dependency[] = [
        { name: 'nonexistent-package', version: '^1.0.0', type: 'dependency' }
      ];

      const mockResponse = {
        ok: false,
        status: 404
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await useCase.execute(dependencies);

      expect(result.totalDependencies).toBe(1);
      expect(result.invalidDependencies).toBe(1);
      expect(result.unknownDependencies).toBe(1);
    });
  });
});
