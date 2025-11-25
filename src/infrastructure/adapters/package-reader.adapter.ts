import { join } from 'node:path';
import type { PackageJson } from '../../domain/entities.js';
import { PackageJsonParseError, PackageJsonReadError } from '../../domain/errors.js';
import type { FileSystemPort, PackageReaderPort } from '../../domain/ports.js';
import { extractDependencies } from '../../domain/utils.js';

export class PackageReaderAdapter implements PackageReaderPort {
  constructor(private readonly fileSystem: FileSystemPort) { }

  async readPackageJson(projectPath: string): Promise<PackageJson> {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      const content = this.fileSystem.readFileSync(packageJsonPath);
      return JSON.parse(content) as PackageJson;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new PackageJsonParseError(
          `Invalid JSON in package.json: ${error.message}`,
          error
        );
      }
      throw new PackageJsonReadError(
        `Error reading package.json: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  extractDependencies(packageJson: PackageJson) {
    return extractDependencies(packageJson);
  }
}

