import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Dependency } from '../../domain/entities.js';
import type { FileSystemPort, LockFileReaderPort } from '../../domain/ports.js';

interface PackageLockDependency {
  version: string;
  dependencies?: Record<string, PackageLockDependency>;
}

interface PackageLock {
  dependencies?: Record<string, PackageLockDependency>;
  packages?: Record<string, { version?: string }>;
}

export class LockFileReaderAdapter implements LockFileReaderPort {
  constructor(private readonly fileSystem: FileSystemPort) { }

  hasLockFile(projectPath: string): boolean {
    return (
      existsSync(join(projectPath, 'package-lock.json')) ||
      existsSync(join(projectPath, 'yarn.lock')) ||
      existsSync(join(projectPath, 'pnpm-lock.yaml'))
    );
  }

  async readLockFile(projectPath: string): Promise<Dependency[]> {
    const dependencies: Dependency[] = [];

    // Try package-lock.json first (npm)
    const packageLockPath = join(projectPath, 'package-lock.json');
    if (existsSync(packageLockPath)) {
      try {
        const content = this.fileSystem.readFileSync(packageLockPath);
        const lockFile = JSON.parse(content) as PackageLock;
        return this.extractFromPackageLock(lockFile);
      } catch (error) {
        // If parsing fails, continue to try other lock files
      }
    }

    // Try yarn.lock
    const yarnLockPath = join(projectPath, 'yarn.lock');
    if (existsSync(yarnLockPath)) {
      try {
        const content = this.fileSystem.readFileSync(yarnLockPath);
        return this.extractFromYarnLock(content);
      } catch (error) {
        // If parsing fails, continue
      }
    }

    // Try pnpm-lock.yaml
    const pnpmLockPath = join(projectPath, 'pnpm-lock.yaml');
    if (existsSync(pnpmLockPath)) {
      try {
        const content = this.fileSystem.readFileSync(pnpmLockPath);
        return this.extractFromPnpmLock(content);
      } catch (error) {
        // If parsing fails, return empty
      }
    }

    return dependencies;
  }

  private extractFromPackageLock(lockFile: PackageLock): Dependency[] {
    const dependencies: Dependency[] = [];

    // package-lock.json v2+ uses "packages" field
    if (lockFile.packages) {
      for (const [packagePath, pkg] of Object.entries(lockFile.packages)) {
        // Skip root package
        if (packagePath === '') continue;

        // Extract package name from path
        // Format: "node_modules/package-name" or "node_modules/@scope/package-name"
        const pathParts = packagePath.split('/');
        let packageName = pathParts[pathParts.length - 1];

        // Handle scoped packages
        if (pathParts.length > 2 && pathParts[pathParts.length - 2].startsWith('@')) {
          packageName = `${pathParts[pathParts.length - 2]}/${packageName}`;
        }

        if (pkg.version) {
          dependencies.push({
            name: packageName,
            version: pkg.version,
            type: 'dependency' // Lock files don't distinguish between types
          });
        }
      }
    } else if (lockFile.dependencies) {
      // package-lock.json v1 uses "dependencies" field (recursive)
      this.extractFromPackageLockV1(lockFile.dependencies, dependencies);
    }

    return dependencies;
  }

  private extractFromPackageLockV1(
    deps: Record<string, PackageLockDependency>,
    result: Dependency[],
    visited = new Set<string>()
  ): void {
    for (const [name, dep] of Object.entries(deps)) {
      const key = `${name}@${dep.version}`;
      if (visited.has(key)) continue;
      visited.add(key);

      result.push({
        name,
        version: dep.version,
        type: 'dependency'
      });

      if (dep.dependencies) {
        this.extractFromPackageLockV1(dep.dependencies, result, visited);
      }
    }
  }

  private extractFromYarnLock(content: string): Dependency[] {
    const dependencies: Dependency[] = [];
    const visited = new Set<string>();

    // Yarn lock file format is complex, this is a simplified parser
    // It looks for entries like: "package-name@version:" followed by version info
    const entryRegex = /^"([^@"]+)@([^"]+)":$/gm;

    let match;
    const entries: Array<{ name: string; requested: string; version?: string }> = [];

    // First pass: find all package entries
    while ((match = entryRegex.exec(content)) !== null) {
      entries.push({
        name: match[1],
        requested: match[2],
        version: undefined
      });
    }

    // Second pass: find versions for each entry
    const lines = content.split('\n');
    let currentEntry = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (entryRegex.test(line)) {
        // Find version in next few lines
        for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
          const versionMatch = lines[j].match(/^\s+version\s+"([^"]+)"/);
          if (versionMatch && currentEntry < entries.length) {
            entries[currentEntry].version = versionMatch[1];
            break;
          }
        }
        currentEntry++;
      }
    }

    // Add unique dependencies
    for (const entry of entries) {
      const version = entry.version || entry.requested;
      const key = `${entry.name}@${version}`;
      if (!visited.has(key) && version) {
        visited.add(key);
        dependencies.push({
          name: entry.name,
          version,
          type: 'dependency'
        });
      }
    }

    return dependencies;
  }

  private extractFromPnpmLock(content: string): Dependency[] {
    const dependencies: Dependency[] = [];
    const visited = new Set<string>();

    // pnpm-lock.yaml is YAML format, simplified parser
    // Look for entries in the "packages" section
    const packagesMatch = content.match(/packages:\s*\n((?:\s+[^\n]+\n?)+)/);
    if (!packagesMatch) return dependencies;

    const packagesSection = packagesMatch[1];
    // Format: "  /package-name/version:"
    const packageRegex = /^\s+\/([^/]+)\/([^:]+):/gm;

    let match;
    while ((match = packageRegex.exec(packagesSection)) !== null) {
      const name = match[1];
      const version = match[2];
      const key = `${name}@${version}`;

      if (!visited.has(key)) {
        visited.add(key);
        dependencies.push({
          name,
          version,
          type: 'dependency'
        });
      }
    }

    return dependencies;
  }
}

