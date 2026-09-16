/**
 * Redis client singleton — lazily connected when REDIS_URL is present.
 *
 * When REDIS_URL is not set (local dev without Redis), all cache operations
 * transparently fall back to the in-process TTLCache so the app still works.
 *
 * Usage:
 *   import { getRedisClient } from '@wow/shared';
 *   const client = getRedisClient(); // null if Redis not configured
 */

import Redis from 'ioredis';
import { log } from './logger';

let _client: Redis | null = null;
let _connectionAttempted = false;

export function getRedisClient(): Redis | null {
  if (_connectionAttempted) return _client;
  _connectionAttempted = true;

  const url = process.env.REDIS_URL;
  if (!url) {
    log.warn('REDIS_URL not set — using in-process TTLCache (single-instance mode). Set REDIS_URL for multi-instance scaling.');
    return null;
  }

  try {
    _client = new Redis(url, {
      // Reconnect automatically with exponential backoff — never crash the process
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      // enableOfflineQueue MUST be true (default) so rate-limit-redis and Socket.IO adapter
      // can queue their init commands while the TCP connection is being established.
      // Commands will flush automatically once the connection is ready.
      connectTimeout: 8000,
    });

    _client.on('connect', () => log.info('Redis connected'));
    _client.on('error',   (err) => log.error('Redis error', { error: err.message }));
    _client.on('close',   () => log.warn('Redis connection closed'));

    return _client;
  } catch (err: any) {
    log.error('Failed to initialize Redis client — falling back to in-process cache', { error: err.message });
    _client = null;
    return null;
  }
}

/** Gracefully close Redis connection during shutdown */
export async function closeRedis(): Promise<void> {
  if (_client) {
    await _client.quit().catch(() => {});
    _client = null;
  }
}
