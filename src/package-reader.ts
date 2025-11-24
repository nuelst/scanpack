import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DependencyInfo, PackageJson } from './types.js';

export class PackageReader {

  static readPackageJson(projectPath: string = process.cwd()): PackageJson {
    try {
      const packageJsonPath = join(projectPath, 'package.json');
      const content = readFileSync(packageJsonPath, 'utf-8');
      return JSON.parse(content) as PackageJson;
    } catch (error) {
      throw new Error(`Error reading package.json: ${error instanceof Error ? error.message : String(error)}`);
    }
  }


  static extractDependencies(packageJson: PackageJson): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push({
          name,
          version,
          type: 'dependency'
        });
      }
    }

    if (packageJson.devDependencies) {
      for (const [name, version] of Object.entries(packageJson.devDependencies)) {
        dependencies.push({
          name,
          version,
          type: 'devDependency'
        });
      }
    }

    if (packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        dependencies.push({
          name,
          version,
          type: 'peerDependency'
        });
      }
    }

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


  static readDependencies(projectPath: string = process.cwd()): DependencyInfo[] {
    const packageJson = this.readPackageJson(projectPath);
    return this.extractDependencies(packageJson);
  }
}

