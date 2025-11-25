import { describe, expect, it } from 'vitest';
import { MaliciousPackageRepositoryAdapter } from '../../src/infrastructure/adapters/malicious-package.repository.adapter.js';

describe('MaliciousPackageRepositoryAdapter', () => {
  const adapter = new MaliciousPackageRepositoryAdapter();

  it('should detect known malicious package', () => {
    const result = adapter.isKnownMalicious('xdater');

    expect(result.isMalicious).toBe(true);
    expect(result.reason).toBeDefined();
  });

  it('should detect package matching pattern', () => {
    const result = adapter.isKnownMalicious('test-malware');

    expect(result.isMalicious).toBe(true);
  });

  it('should return false for valid package', () => {
    const result = adapter.isKnownMalicious('react');

    expect(result.isMalicious).toBe(false);
  });
});

