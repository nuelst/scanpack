import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import type { FileSystemPort } from '../../domain/ports.js';

export class FileSystemAdapter implements FileSystemPort {
  async readFile(path: string): Promise<string> {
    return await readFile(path, 'utf-8');
  }

  readFileSync(path: string): string {
    return readFileSync(path, 'utf-8');
  }
}

