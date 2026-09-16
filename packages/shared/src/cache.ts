/**
 * Unified async cache — Redis-backed when REDIS_URL is set, in-process Map fallback otherwise.
 *
 * All methods are async (return Promises) so callers can await them regardless of backend.
 * The in-process fallback (TTLCache) is retained for local dev with no Redis dependency.
 *
 * Cache instances are deliberately NOT pre-connected; they call getRedisClient() lazily
 * on first use so the express server can start before Redis is ready.
 *
 * For multi-instance deployments (e.g. 2 Render services behind a load balancer):
 *   - Set REDIS_URL to share state across instances
 *   - OTP, pending-registration, rate-limit counters, and catalog are all consistent
 */

import { getRedisClient } from './redis';
import { log } from './logger';

// ── In-process fallback (zero-dependency, single-instance) ────────────────────

export class TTLCache<V = unknown> {
  private store = new Map<string, { value: V; expiresAt: number }>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs = 5 * 60 * 1000) {
    this.cleanupTimer = setInterval(() => this.sweep(), cleanupIntervalMs);
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  set(key: string, value: V, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) { this.store.delete(key); return undefined; }
    return entry.value;
  }

  has(key: string): boolean { return this.get(key) !== undefined; }
  delete(key: string): void { this.store.delete(key); }

  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  get size(): number { return this.store.size; }

  sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  destroy(): void { clearInterval(this.cleanupTimer); this.store.clear(); }
}

// ── Async-unified cache (Redis → TTLCache fallback) ───────────────────────────

/**
 * AsyncCache wraps both Redis and TTLCache behind a unified async API.
 *
 * When Redis is available: all operations hit Redis — consistent across instances.
 * When Redis is unavailable: all operations hit an in-process TTLCache — fine for a single instance.
 *
 * The namespace prefix isolates different cache domains (e.g. 'otp:', 'catalog:').
 */
export class AsyncCache<V = unknown> {
  private memory: TTLCache<V>;
  private readonly ns: string; // namespace prefix for Redis keys

  constructor(namespace: string, cleanupIntervalMs = 5 * 60 * 1000) {
    this.ns  = `wow:${namespace}:`;
    this.memory = new TTLCache<V>(cleanupIntervalMs);
  }

  private key(k: string): string { return `${this.ns}${k}`; }

  async set(key: string, value: V, ttlMs: number): Promise<void> {
    const redis = getRedisClient();
    if (redis) {
      try {
        const ttlSec = Math.max(1, Math.ceil(ttlMs / 1000));
        await redis.setex(this.key(key), ttlSec, JSON.stringify(value));
        return;
      } catch (err: any) {
        log.warn('Redis set failed — falling back to memory cache', { error: err.message, key });
      }
    }
    this.memory.set(key, value, ttlMs);
  }

  async get(key: string): Promise<V | undefined> {
    const redis = getRedisClient();
    if (redis) {
      try {
        const raw = await redis.get(this.key(key));
        if (raw === null) return undefined;
        return JSON.parse(raw) as V;
      } catch (err: any) {
        log.warn('Redis get failed — falling back to memory cache', { error: err.message, key });
      }
    }
    return this.memory.get(key);
  }

  async has(key: string): Promise<boolean> {
    return (await this.get(key)) !== undefined;
  }

  async delete(key: string): Promise<void> {
    const redis = getRedisClient();
    if (redis) {
      try {
        await redis.del(this.key(key));
        return;
      } catch (err: any) {
        log.warn('Redis del failed — falling back to memory cache', { error: err.message, key });
      }
    }
    this.memory.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const redis = getRedisClient();
    const fullPrefix = this.key(prefix);
    if (redis) {
      try {
        // SCAN is non-blocking unlike KEYS — safe for production
        let cursor = '0';
        do {
          const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${fullPrefix}*`, 'COUNT', 100);
          cursor = nextCursor;
          if (keys.length > 0) await redis.del(...keys);
        } while (cursor !== '0');
        return;
      } catch (err: any) {
        log.warn('Redis deleteByPrefix failed — falling back to memory cache', { error: err.message, prefix });
      }
    }
    this.memory.deleteByPrefix(prefix);
  }
}

// ── Singleton shared caches ───────────────────────────────────────────────────
// Each instance has a unique namespace so Redis keys never collide.

/** OTP store: { otp, expiresAt } per email (TTL: 5 min) */
export const otpCache = new AsyncCache<{ otp: string; expiresAt: number }>('otp', 10 * 60 * 1000);

/** Pending registration cache: { name, phone, email, password? } per email (TTL: 10 min) */
export const pendingRegCache = new AsyncCache<{ name: string; phone: string; email: string; password?: string }>('preg', 10 * 60 * 1000);

/** OTP attempt counter: number of failed attempts per email (TTL: 15 min) */
export const otpAttemptCache = new AsyncCache<number>('otpattempt', 15 * 60 * 1000);

/** Catalog cache: shops list + per-shop catalog (TTL: 30–60s) */
export const catalogCache = new AsyncCache<unknown>('catalog', 2 * 60 * 1000);

/** Analytics cache: aggregation results per shop+range (TTL: 60s) */
export const analyticsCache = new AsyncCache<unknown>('analytics', 2 * 60 * 1000);
