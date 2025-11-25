import * as fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PackageReader } from '../../src/package-reader.js';
import type { PackageJson } from '../../src/types.js';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn()
}));

describe('PackageReader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readPackageJson', () => {
    it('should read and parse package.json successfully', () => {
      const mockPackageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0'
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPackageJson));

      const result = PackageReader.readPackageJson('/test/path');

      expect(result).toEqual(mockPackageJson);
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('package.json'),
        'utf-8'
      );
    });

    it('should throw error when package.json does not exist', () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(() => PackageReader.readPackageJson('/invalid/path')).toThrow(
        'Error reading package.json'
      );
    });

    it('should throw error when package.json is invalid JSON', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      expect(() => PackageReader.readPackageJson('/test/path')).toThrow();
    });
  });

  describe('extractDependencies', () => {
    it('should extract all dependency types', () => {
      const packageJson: PackageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0' },
        peerDependencies: { 'react-dom': '^18.0.0' },
        optionalDependencies: { 'optional-pkg': '^1.0.0' }
      };

      const result = PackageReader.extractDependencies(packageJson);

      expect(result).toHaveLength(4);
      expect(result).toContainEqual({
        name: 'react',
        version: '^18.0.0',
        type: 'dependency'
      });
      expect(result).toContainEqual({
        name: 'typescript',
        version: '^5.0.0',
        type: 'devDependency'
      });
      expect(result).toContainEqual({
        name: 'react-dom',
        version: '^18.0.0',
        type: 'peerDependency'
      });
      expect(result).toContainEqual({
        name: 'optional-pkg',
        version: '^1.0.0',
        type: 'optionalDependency'
      });
    });

    it('should return empty array when no dependencies', () => {
      const packageJson: PackageJson = {};

      const result = PackageReader.extractDependencies(packageJson);

      expect(result).toEqual([]);
    });

    it('should handle partial dependencies', () => {
      const packageJson: PackageJson = {
        dependencies: { react: '^18.0.0' }
      };

      const result = PackageReader.extractDependencies(packageJson);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('dependency');
    });
  });

  describe('readDependencies', () => {
    it('should read and extract dependencies from project', () => {
      const mockPackageJson: PackageJson = {
        dependencies: { react: '^18.0.0' },
        devDependencies: { typescript: '^5.0.0' }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPackageJson));

      const result = PackageReader.readDependencies('/test/path');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('react');
      expect(result[1].name).toBe('typescript');
    });
  });
});

