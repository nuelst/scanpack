import type { Dependency, PackageJson } from './entities.js';

/**
 * Extracts all dependencies from a package.json
 * Shared utility to avoid code duplication
 */
export function extractDependencies(packageJson: PackageJson): Dependency[] {
  const dependencies: Dependency[] = [];

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

