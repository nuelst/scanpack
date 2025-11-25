import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DependencyInfo } from '../../src/types.js';
import { DependencyValidator } from '../../src/validator.js';

// Mock fetch will be set up in setup.ts

describe('DependencyValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkNpmPackage', () => {
    it('should return exists: true for valid package', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await DependencyValidator.checkNpmPackage('react');

      expect(result).toEqual({
        exists: true,
        url: 'https://www.npmjs.com/package/react',
        isSecurityHolding: false
      });
      expect(fetch).toHaveBeenCalledWith('https://registry.npmjs.org/react');
    });

    it('should detect security holding package', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '0.0.1-security' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await DependencyValidator.checkNpmPackage('malicious-pkg');

      expect(result).toEqual({
        exists: true,
        url: 'https://www.npmjs.com/package/malicious-pkg',
        isSecurityHolding: true
      });
    });

    it('should detect security holding with version ending in -security', async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0-security' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await DependencyValidator.checkNpmPackage('test-pkg');

      expect(result.isSecurityHolding).toBe(true);
    });

    it('should return exists: false for 404', async () => {
      const mockResponse = {
        ok: false,
        status: 404
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await DependencyValidator.checkNpmPackage('nonexistent');

      expect(result).toEqual({ exists: false });
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

      const result = await DependencyValidator.checkNpmPackage('test');

      expect(result).toEqual({ exists: false });
    });
  });

  describe('isKnownMalicious', () => {
    it('should detect package in malicious list', () => {
      const result = DependencyValidator.isKnownMalicious('xdater');

      expect(result.isMalicious).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it('should detect package matching pattern', () => {
      const result = DependencyValidator.isKnownMalicious('test-malware');

      expect(result.isMalicious).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it('should return false for valid package', () => {
      const result = DependencyValidator.isKnownMalicious('react');

      expect(result.isMalicious).toBe(false);
    });

    it('should be case insensitive', () => {
      const result1 = DependencyValidator.isKnownMalicious('XDATER');
      const result2 = DependencyValidator.isKnownMalicious('xdater');

      expect(result1.isMalicious).toBe(result2.isMalicious);
    });
  });

  describe('validateDependency', () => {
    it('should validate valid package', async () => {
      const dependency: DependencyInfo = {
        name: 'react',
        version: '^18.0.0',
        type: 'dependency'
      };

      const mockResponse = {
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '18.2.0' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await DependencyValidator.validateDependency(dependency);

      expect(result.isValid).toBe(true);
      expect(result.existsOnNpm).toBe(true);
      expect(result.isKnownMalicious).toBe(false);
    });

    it('should mark malicious package as invalid', async () => {
      const dependency: DependencyInfo = {
        name: 'xdater',
        version: '^6.2.0',
        type: 'dependency'
      };

      const mockResponse = {
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '0.0.1-security' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await DependencyValidator.validateDependency(dependency);

      expect(result.isValid).toBe(false);
      expect(result.isKnownMalicious).toBe(true);
      expect(result.isSecurityHolding).toBe(true);
    });

    it('should mark unknown package as invalid', async () => {
      const dependency: DependencyInfo = {
        name: 'nonexistent-package',
        version: '^1.0.0',
        type: 'dependency'
      };

      const mockResponse = {
        ok: false,
        status: 404
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await DependencyValidator.validateDependency(dependency);

      expect(result.isValid).toBe(false);
      expect(result.existsOnNpm).toBe(false);
      expect(result.reason).toBe('Package not found on npm');
    });
  });

  describe('validateDependencies', () => {
    it('should validate multiple dependencies', async () => {
      const dependencies: DependencyInfo[] = [
        { name: 'react', version: '^18.0.0', type: 'dependency' },
        { name: 'typescript', version: '^5.0.0', type: 'devDependency' }
      ];

      const mockResponse = {
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await DependencyValidator.validateDependencies(dependencies);

      expect(result.totalDependencies).toBe(2);
      expect(result.validDependencies).toBe(2);
      expect(result.invalidDependencies).toBe(0);
      expect(result.results).toHaveLength(2);
    });

    it('should process dependencies in batches', async () => {
      const dependencies: DependencyInfo[] = Array.from({ length: 25 }, (_, i) => ({
        name: `package-${i}`,
        version: '^1.0.0',
        type: 'dependency' as const
      }));

      const mockResponse = {
        ok: true,
        json: async () => ({
          'dist-tags': { latest: '1.0.0' }
        })
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

      const result = await DependencyValidator.validateDependencies(dependencies);

      expect(result.totalDependencies).toBe(25);
      expect(fetch).toHaveBeenCalledTimes(25);
    });

    it('should correctly count malicious and unknown dependencies', async () => {
      const dependencies: DependencyInfo[] = [
        { name: 'react', version: '^18.0.0', type: 'dependency' },
        { name: 'xdater', version: '^6.2.0', type: 'dependency' },
        { name: 'nonexistent', version: '^1.0.0', type: 'dependency' }
      ];

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 'dist-tags': { latest: '18.0.0' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ 'dist-tags': { latest: '0.0.1-security' } })
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          status: 404
        } as Response);

      const result = await DependencyValidator.validateDependencies(dependencies);

      expect(result.totalDependencies).toBe(3);
      expect(result.validDependencies).toBe(1);
      expect(result.invalidDependencies).toBe(2);
      expect(result.maliciousDependencies).toBe(1);
      expect(result.unknownDependencies).toBe(1);
    });
  });
});

