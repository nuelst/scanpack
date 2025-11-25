import pino from 'pino';
import type { LoggerPort } from '../../domain/ports.js';

const isDevelopment = process.env.NODE_ENV !== 'production';
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');

const pinoLogger = pino({
  level: process.env.LOG_LEVEL || (isVerbose ? 'debug' : 'info'),
  transport: isDevelopment && isVerbose
    ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname'
      }
    }
    : undefined,
  enabled: isVerbose || process.env.LOG_ENABLED === 'true'
});

export class LoggerAdapter implements LoggerPort {
  info(message: string, ...args: unknown[]): void {
    pinoLogger.info({ ...this.parseArgs(args) }, message);
  }

  error(message: string, ...args: unknown[]): void {
    pinoLogger.error({ ...this.parseArgs(args) }, message);
  }

  warn(message: string, ...args: unknown[]): void {
    pinoLogger.warn({ ...this.parseArgs(args) }, message);
  }

  debug(message: string, ...args: unknown[]): void {
    pinoLogger.debug({ ...this.parseArgs(args) }, message);
  }

  private parseArgs(args: unknown[]): Record<string, unknown> {
    if (args.length === 0) return {};
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      return args[0] as Record<string, unknown>;
    }
    return { data: args };
  }
}

