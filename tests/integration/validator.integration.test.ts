import { describe, it, expect, beforeAll } from 'vitest';
import { DependencyValidator } from '../../src/validator.js';
import type { DependencyInfo } from '../../src/types.js';

// Integration tests - these make real API calls
// Use sparingly and consider rate limiting

describe('DependencyValidator Integration', () => {
  describe('checkNpmPackage - Real API', () => {
    it('should check real package on npm', async () => {
      const result = await DependencyValidator.checkNpmPackage('react');

      expect(result.exists).toBe(true);
      expect(result.url).toBe('https://www.npmjs.com/package/react');
      expect(result.isSecurityHolding).toBe(false);
    }, 10000);

    it('should detect real security holding package', async () => {
      const result = await DependencyValidator.checkNpmPackage('xdater');

      expect(result.exists).toBe(true);
      expect(result.isSecurityHolding).toBe(true);
    }, 10000);

    it('should return false for non-existent package', async () => {
      const result = await DependencyValidator.checkNpmPackage(
        'this-package-definitely-does-not-exist-12345'
      );

      expect(result.exists).toBe(false);
    }, 10000);
  });

  describe('validateDependency - Real API', () => {
    it('should validate real valid package', async () => {
      const dependency: DependencyInfo = {
        name: 'lodash',
        version: '^4.17.21',
        type: 'dependency'
      };

      const result = await DependencyValidator.validateDependency(dependency);

      expect(result.isValid).toBe(true);
      expect(result.existsOnNpm).toBe(true);
      expect(result.isKnownMalicious).toBe(false);
    }, 10000);

    it('should detect real malicious package', async () => {
      const dependency: DependencyInfo = {
        name: 'xdater',
        version: '^6.2.0',
        type: 'dependency'
      };

      const result = await DependencyValidator.validateDependency(dependency);

      expect(result.isValid).toBe(false);
      expect(result.isKnownMalicious).toBe(true);
    }, 10000);
  });
});

