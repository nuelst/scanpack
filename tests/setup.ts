// Test setup file - runs before all tests
import { vi } from 'vitest';

// Setup global mocks
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = vi.fn() as typeof fetch;
}

