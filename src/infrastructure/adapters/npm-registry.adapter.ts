import type { NpmRegistryPort, RateLimiterPort } from '../../domain/ports.js';

export class NpmRegistryAdapter implements NpmRegistryPort {
  constructor(private readonly rateLimiter?: RateLimiterPort) { }

  async checkPackage(packageName: string): Promise<{
    exists: boolean;
    url?: string;
    isSecurityHolding?: boolean;
  }> {
    // Apply rate limiting if configured
    if (this.rateLimiter) {
      await this.rateLimiter.wait();
    }

    try {
      const response = await fetch(`https://registry.npmjs.org/${packageName}`);

      if (response.ok) {
        const data = await response.json() as { 'dist-tags'?: { latest?: string } };
        const latestVersion = data['dist-tags']?.latest;
        const isSecurityHolding = latestVersion === '0.0.1-security' || latestVersion?.endsWith('-security');

        return {
          exists: true,
          url: `https://www.npmjs.com/package/${packageName}`,
          isSecurityHolding
        };
      }

      if (response.status === 404) {
        return { exists: false };
      }

      return { exists: false };
    } catch (error) {

      return { exists: false };
    }
  }
}

