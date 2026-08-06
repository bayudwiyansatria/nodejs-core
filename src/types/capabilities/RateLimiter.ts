import { Capability } from '@/types/capabilities/Capability'

/**
 * @interface
 *
 * Admission control — whether a caller may proceed right now.
 *
 * @remarks
 * An abuse control, never an accounting record. Implementations are expected to
 * be approximate and eventually consistent, so nothing that must balance should
 * be derived from how many times this said yes.
 *
 * What an *unavailable* limiter does is the one thing an implementation must
 * not decide on its own: failing open turns a missing limiter into a capacity
 * problem, failing closed turns it into an outage, and which is correct depends
 * on whether the limiter is protecting an upstream or protecting a bill. It is
 * therefore a configuration decision — see `rateLimit.failOpen`.
 *
 * @typeParam TRuntime The runtime handle the limiter is resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface RateLimiter<TRuntime = unknown> extends Capability<TRuntime> {
  /**
   * Counts one request against a key and reports whether it is within the rate.
   *
   * @param runtime The runtime handle.
   * @param key What the rate is counted per — an IP, an account, a route.
   * @returns `true` when the caller may proceed.
   */
  admit(runtime: TRuntime, key: string): Promise<boolean>
}
