import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NpmRegistryAdapter } from '../../src/infrastructure/adapters/npm-registry.adapter.js';

globalThis.fetch = vi.fn() as typeof fetch;

describe('NpmRegistryAdapter', () => {
  const adapter = new NpmRegistryAdapter();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should check valid package', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        'dist-tags': { latest: '1.0.0' }
      })
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const result = await adapter.checkPackage('react');

    expect(result.exists).toBe(true);
    expect(result.isSecurityHolding).toBe(false);
  });

  it('should detect security holding package', async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({
        'dist-tags': { latest: '0.0.1-security' }
      })
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const result = await adapter.checkPackage('malicious-pkg');

    expect(result.exists).toBe(true);
    expect(result.isSecurityHolding).toBe(true);
  });

  it('should return false for non-existent package', async () => {
    const mockResponse = {
      ok: false,
      status: 404
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const result = await adapter.checkPackage('nonexistent');

    expect(result.exists).toBe(false);
  });

  it('should handle network errors', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await adapter.checkPackage('test');

    expect(result.exists).toBe(false);
  });

  it('should handle non-404 errors', async () => {
    const mockResponse = {
      ok: false,
      status: 500
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const result = await adapter.checkPackage('test');

    expect(result.exists).toBe(false);
  });
});

