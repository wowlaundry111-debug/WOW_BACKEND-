/**
 * TTLCache — A lightweight in-process key-value cache with per-entry TTL.
 *
 * Designed for Render single-process deployments. When scaling to multi-instance,
 * replace this with a Redis adapter by implementing the same interface.
 *
 * Features:
 * - Per-entry TTL (time-to-live in milliseconds)
 * - Automatic background cleanup every `cleanupIntervalMs` (default 5 min)
 * - Zero external dependencies
 * - Generic type-safe API
 */
export class TTLCache<V = unknown> {
  private store = new Map<string, { value: V; expiresAt: number }>();
  private cleanupTimer: ReturnType<typeof setInterval>;

  constructor(cleanupIntervalMs = 5 * 60 * 1000) {
    // Periodic stale-entry sweep — prevents unbounded memory growth
    this.cleanupTimer = setInterval(() => this.sweep(), cleanupIntervalMs);
    // Don't let this timer keep the process alive during shutdown
    if (this.cleanupTimer.unref) this.cleanupTimer.unref();
  }

  /** Store a value with a TTL in milliseconds. */
  set(key: string, value: V, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Retrieve a value. Returns `undefined` if missing or expired. */
  get(key: string): V | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  /** Check if a key exists and is not expired. */
  has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  /** Delete a specific key. */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** Delete all keys matching a prefix (useful for cache invalidation). */
  deleteByPrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  /** Get the size of the cache (including possibly-expired entries not yet swept). */
  get size(): number {
    return this.store.size;
  }

  /** Remove all expired entries from the store. */
  sweep(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) this.store.delete(key);
    }
  }

  /** Destroy the cleanup timer (call on graceful shutdown). */
  destroy(): void {
    clearInterval(this.cleanupTimer);
    this.store.clear();
  }
}

// Singleton shared caches — pre-instantiated for reuse across services

/** Catalog cache: shops list + per-shop catalog (TTL: 60s) */
export const catalogCache = new TTLCache<unknown>();

/** Analytics cache: aggregation results per shop+range (TTL: 60s) */
export const analyticsCache = new TTLCache<unknown>();

/** OTP store: { otp, expiresAt } per email (TTL: 5 min, auto-cleanup: 10 min) */
export const otpCache = new TTLCache<{ otp: string; expiresAt: number }>(10 * 60 * 1000);

/** Pending registration cache: { name, phone, email } per email (TTL: 10 min) */
export const pendingRegCache = new TTLCache<{ name: string; phone: string; email: string }>(10 * 60 * 1000);

/** OTP attempt counter: number of failed attempts per email (TTL: 15 min) */
export const otpAttemptCache = new TTLCache<number>(15 * 60 * 1000);
