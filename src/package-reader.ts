import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PackageJsonParseError, PackageJsonReadError } from './domain/errors.js';
import { extractDependencies } from './domain/utils.js';
import type { DependencyInfo, PackageJson } from './types.js';

export class PackageReader {
  static readPackageJson(projectPath: string = process.cwd()): PackageJson {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      const content = readFileSync(packageJsonPath, 'utf-8');
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

  static extractDependencies(packageJson: PackageJson): DependencyInfo[] {
    return extractDependencies(packageJson);
  }

  static readDependencies(projectPath: string = process.cwd()): DependencyInfo[] {
    const packageJson = this.readPackageJson(projectPath);
    return this.extractDependencies(packageJson);
  }
}
