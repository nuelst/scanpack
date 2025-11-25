import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { FileSystemPort } from '../../domain/ports.js';

export class IgnoreListAdapter {
  constructor(
    private readonly fileSystem: FileSystemPort,
    private readonly projectPath: string
  ) { }

  getIgnoreList(): string[] {
    const ignoreList: string[] = [];

    // Check for .scanpackignore file
    const ignoreFilePath = join(this.projectPath, '.scanpackignore');
    if (existsSync(ignoreFilePath)) {
      try {
        const content = this.fileSystem.readFileSync(ignoreFilePath);
        const lines = content
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('#'));
        ignoreList.push(...lines);
      } catch (error) {
        // Silently fail if can't read ignore file
      }
    }

    return ignoreList;
  }
}

