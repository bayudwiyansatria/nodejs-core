import { Capability } from '@/types/capabilities/Capability'

/**
 * @interface
 *
 * A key-value cache holding JSON-serialisable values under a lifetime.
 *
 * @remarks
 * A cache is optional infrastructure by definition: an implementation whose
 * {@link Capability.isAvailable} is `false` must read as a miss and drop writes
 * rather than throwing, so a deployment without one runs slower instead of
 * failing. That is a requirement on every implementation, not an accident of one of
 * them — a caller that branched on it would defeat the point.
 *
 * @typeParam TRuntime The runtime handle the cache is resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface CacheStore<TRuntime = unknown> extends Capability<TRuntime> {
  /**
   * Reads a cached value.
   *
   * @param runtime The runtime handle.
   * @param key The cache key.
   * @returns The value, or `null` on a miss or an unavailable cache.
   */
  get<T = unknown>(runtime: TRuntime, key: string): Promise<T | null>

  /**
   * Writes a value.
   *
   * @param runtime The runtime handle.
   * @param key The cache key.
   * @param value The value to store.
   * @param ttl Lifetime in seconds. Falls back to the configured default.
   */
  set(runtime: TRuntime, key: string, value: unknown, ttl?: number): Promise<void>

  /**
   * Drops a cached value. Removing a key that was never written is not an error.
   *
   * @param runtime The runtime handle.
   * @param key The cache key.
   */
  remove(runtime: TRuntime, key: string): Promise<void>

  /**
   * Returns a cached value, computing and caching it on a miss.
   *
   * @remarks
   * The read-through pattern most callers actually want — one call instead of a
   * get, a branch, and a set. On an unavailable cache this still returns the
   * computed value; only the caching is skipped.
   *
   * @param runtime The runtime handle.
   * @param key The cache key.
   * @param load Computes the value when the cache misses.
   * @param ttl Lifetime in seconds. Falls back to the configured default.
   * @returns The cached or freshly computed value.
   */
  remember<T>(runtime: TRuntime, key: string, load: () => Promise<T>, ttl?: number): Promise<T>

  /**
   * Lists the keys under a prefix.
   *
   * @param runtime The runtime handle.
   * @param prefix The key prefix to match.
   * @returns The matched key names.
   */
  keys(runtime: TRuntime, prefix: string): Promise<string[]>
}
