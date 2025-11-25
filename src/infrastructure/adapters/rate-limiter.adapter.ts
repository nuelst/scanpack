import type { RateLimiterPort } from '../../domain/ports.js';

export class RateLimiterAdapter implements RateLimiterPort {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequestsPerSecond: number = 10) {
    this.maxRequests = maxRequestsPerSecond;
    this.windowMs = 1000; // 1 second window
  }

  async wait(): Promise<void> {
    const now = Date.now();

    // Remove requests outside the time window
    this.requests = this.requests.filter(timestamp => now - timestamp < this.windowMs);

    // If we're at the limit, wait until the oldest request expires
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest) + 10; // +10ms buffer

      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      // Clean up again after waiting
      const newNow = Date.now();
      this.requests = this.requests.filter(timestamp => newNow - timestamp < this.windowMs);
    }

    // Record this request
    this.requests.push(Date.now());
  }

  reset(): void {
    this.requests = [];
  }
}

