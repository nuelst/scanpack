import type { Dependency } from '../../domain/entities.js';
import type { PackageReaderPort } from '../../domain/ports.js';

export class ReadDependenciesUseCase {
  constructor(private readonly packageReader: PackageReaderPort) { }

  async execute(projectPath: string): Promise<Dependency[]> {
    const packageJson = await this.packageReader.readPackageJson(projectPath);
    return this.packageReader.extractDependencies(packageJson);
  }
}

