/**
 * Structured JSON logger — zero external dependencies.
 *
 * Produces machine-parseable log lines compatible with Render log drains,
 * Datadog, Logtail, or any NDJSON-based log aggregator.
 *
 * Usage:
 *   import { log } from './logger';
 *   log.info('Server started', { port: 3000 });
 *   log.warn('Rate limit hit', { ip: '1.2.3.4', route: '/api/auth/send-otp' });
 *   log.error('DB query failed', { error: err.message });
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const isProd = process.env.NODE_ENV === 'production';

function write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  // In production: structured JSON (parse-friendly for log aggregators)
  if (isProd) {
    const entry: Record<string, unknown> = {
      ts: new Date().toISOString(),
      level,
      msg: message,
    };
    if (meta) Object.assign(entry, meta);
    // Use process.stdout directly to avoid console's sync write lock
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    // Dev: human-readable colorised output
    const colors: Record<LogLevel, string> = {
      info: '\x1b[36m',   // cyan
      warn: '\x1b[33m',   // yellow
      error: '\x1b[31m',  // red
      debug: '\x1b[35m',  // magenta
    };
    const reset = '\x1b[0m';
    const ts = new Date().toISOString().slice(11, 23); // HH:MM:SS.mmm
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';
    process.stdout.write(`${colors[level]}[${level.toUpperCase()}]${reset} ${ts} ${message}${metaStr}\n`);
  }
}

export const log = {
  info: (message: string, meta?: Record<string, unknown>) => write('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => {
    if (!isProd) write('debug', message, meta);
  },
};

/**
 * Express request logger middleware.
 * Replaces the raw `console.log` per-request log (which was synchronous).
 * Only logs warn/error for routes that take >500ms or return 4xx/5xx.
 */
export function requestLogger() {
  return (
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction
  ): void => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      const status = res.statusCode;
      const meta = {
        method: req.method,
        url: req.url,
        status,
        ms,
        ip: req.ip,
      };

      if (status >= 500) {
        log.error('Request failed', meta);
      } else if (status >= 400 || ms > 2000) {
        log.warn('Slow or client-error request', meta);
      } else if (!isProd || ms > 500) {
        // In dev log everything; in prod only log slow requests
        log.info('Request', meta);
      }
    });
    next();
  };
}
