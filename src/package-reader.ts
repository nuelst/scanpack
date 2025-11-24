import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DependencyInfo, PackageJson } from './types.js';

export class PackageReader {
  /**
   * Reads the package.json of a project
   */
  static readPackageJson(projectPath: string = process.cwd()): PackageJson {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      const content = readFileSync(packageJsonPath, 'utf-8');
      return JSON.parse(content) as PackageJson;
    } catch (error) {
      throw new Error(`Error reading package.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Extracts all dependencies from package.json
   */
  static extractDependencies(packageJson: PackageJson): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    // Main dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push({
          name,
          version,
          type: 'dependency'
        });
      }
    }

    // Development dependencies
    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        dependencies.push({
          name,
          version,
          type: 'devDependency'
        });
      }
    }

    // Peer dependencies
    if (packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        dependencies.push({  /**
          * Reads and extracts dependencies from a project
          */
          name,
          version,
          type: 'peerDependency'
        });
      }
    }

    // Optional dependencies
    if (packageJson.optionalDependencies) {
      for (const [name, version] of Object.entries(packageJson.optionalDependencies)) {
        dependencies.push({
          name,
          version,
          type: 'optionalDependency'
        });
      }
    }

    return dependencies;
  }

  /**
   * Reads and extracts dependencies from a project
   */
  static readDependencies(projectPath: string = process.cwd()): DependencyInfo[] {
    const packageJson = this.readPackageJson(projectPath);
    return this.extractDependencies(packageJson);
  }
}

