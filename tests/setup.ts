// Test setup file - runs before all tests
import { vi } from 'vitest';

// Setup global mocks
if (!global.fetch) {
  global.fetch = vi.fn();
}

