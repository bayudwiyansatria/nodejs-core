import { CacheStore } from '@/types/capabilities/CacheStore'

/**
 * @class
 *
 * A cache that stores nothing.
 *
 * @remarks
 * Every read misses, every write is dropped, and {@link NoopCacheStore.remember}
 * still returns the computed value — which is exactly the behaviour
 * [`CacheStore`](../../types/capabilities/CacheStore.ts) requires of an unavailable cache. That makes
 * this a substitutable stand-in rather than a stub: code written against the
 * interface cannot tell it apart from a real cache that keeps missing, because
 * there is no observable difference to find.
 *
 * Use it to run deliberately without a cache, or as the test double
 * that proves a caller does not secretly depend on a hit.
 *
 * @typeParam TRuntime The runtime handle, ignored throughout.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export class NoopCacheStore<TRuntime = unknown> implements CacheStore<TRuntime> {
  /**
   * Always a miss.
   *
   * @returns `null`.
   */
  public async get<T = unknown>(): Promise<T | null> {
    return null
  }

  /**
   * Drops the write.
   */
  public async set(): Promise<void> {}

  /**
   * Nothing to remove.
   */
  public async remove(): Promise<void> {}

  /**
   * Computes the value and returns it uncached.
   *
   * @param runtime The runtime handle, ignored.
   * @param key The cache key, ignored.
   * @param load Computes the value.
   * @returns The computed value.
   */
  public async remember<T>(runtime: TRuntime, key: string, load: () => Promise<T>): Promise<T> {
    return await load()
  }

  /**
   * Nothing is stored, so nothing is listed.
   *
   * @returns An empty array.
   */
  public async keys(): Promise<string[]> {
    return []
  }

  /**
   * Never available — which is the whole point.
   *
   * @returns `false`.
   */
  public isAvailable(): boolean {
    return false
  }
}
