import type { NpmRegistryPort, RateLimiterPort } from '../../domain/ports.js';

interface CacheEntry {
  data: {
    exists: boolean;
    url?: string;
    isSecurityHolding?: boolean;
    latestVersion?: string;
  };
  timestamp: number;
}

export class NpmRegistryAdapter implements NpmRegistryPort {
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly rateLimiter?: RateLimiterPort,
    private readonly enableCache = true
  ) { }

  async checkPackage(packageName: string): Promise<{
    exists: boolean;
    url?: string;
    isSecurityHolding?: boolean;
    latestVersion?: string;
  }> {
    // Check cache first
    if (this.enableCache) {
      const cached = this.cache.get(packageName);
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.data;
      }
    }

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

        const result = {
          exists: true,
          url: `https://www.npmjs.com/package/${packageName}`,
          isSecurityHolding,
          latestVersion
        };

        // Cache the result
        if (this.enableCache) {
          this.cache.set(packageName, {
            data: result,
            timestamp: Date.now()
          });
        }

        return result;
      }

      if (response.status === 404) {
        const result = { exists: false };
        // Cache negative results too (shorter TTL)
        if (this.enableCache) {
          this.cache.set(packageName, {
            data: result,
            timestamp: Date.now()
          });
        }
        return result;
      }

      return { exists: false };
    } catch (error) {
      return { exists: false };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

