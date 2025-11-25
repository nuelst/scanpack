import { describe, expect, it } from 'vitest';
import {
  readDependenciesUseCase,
  validateDependenciesUseCase
} from '../../src/infrastructure/container.js';

describe('Container', () => {
  it('should create readDependenciesUseCase', () => {
    expect(readDependenciesUseCase).toBeDefined();
    expect(typeof readDependenciesUseCase.execute).toBe('function');
  });

  it('should create validateDependenciesUseCase', () => {
    expect(validateDependenciesUseCase).toBeDefined();
    expect(typeof validateDependenciesUseCase.execute).toBe('function');
  });
});

