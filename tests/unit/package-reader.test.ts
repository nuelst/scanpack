import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PackageJson } from '../../src/domain/entities.js';
import { FileSystemAdapter } from '../../src/infrastructure/adapters/file-system.adapter.js';
import { PackageReaderAdapter } from '../../src/infrastructure/adapters/package-reader.adapter.js';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn()
}));

import * as fs from 'node:fs';

describe('PackageReaderAdapter', () => {
  const fileSystem = new FileSystemAdapter();
  const packageReader = new PackageReaderAdapter(fileSystem);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('readPackageJson', () => {
    it('should read and parse package.json successfully', async () => {
      const mockPackageJson: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0'
        }
      };

      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockPackageJson));

      const result = await packageReader.readPackageJson('/test/path');

      expect(result).toEqual(mockPackageJson);
    });

    it('should throw error when package.json does not exist', async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      await expect(packageReader.readPackageJson('/invalid/path')).rejects.toThrow(
        'Error reading package.json'
      );
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

      const result = packageReader.extractDependencies(packageJson);

      expect(result).toHaveLength(4);
      expect(result[0].name).toBe('react');
      expect(result[1].name).toBe('typescript');
      expect(result[2].name).toBe('react-dom');
      expect(result[3].name).toBe('optional-pkg');
    });

    it('should return empty array when no dependencies', () => {
      const packageJson: PackageJson = {};

      const result = packageReader.extractDependencies(packageJson);

      expect(result).toEqual([]);
    });
  });
});
