import { RateLimiter } from '@/types/capabilities/RateLimiter'

/**
 * @class
 *
 * A limiter that counts nothing.
 *
 * @remarks
 * Unlike the other no-ops, this one takes a decision in its constructor,
 * because "no limiter" has two defensible meanings and picking silently is how
 * an open endpoint gets shipped:
 *
 * - **Open** (the default) — every caller is admitted. Right when the limiter
 *   protects an upstream against load, where its absence is a capacity problem.
 * - **Closed** — nobody is admitted. Right when the limiter is the only thing
 *   between an unauthenticated endpoint and someone else's bill, where its
 *   absence should be a visible outage rather than a silent open door.
 *
 * It mirrors `rateLimit.failOpen` in the configuration layer deliberately: the
 * same question, answered in the same two ways, whichever implementation is in
 * use.
 *
 * @typeParam TRuntime The runtime handle, ignored throughout.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export class NoopRateLimiter<TRuntime = unknown> implements RateLimiter<TRuntime> {
  /**
   * Whether callers are admitted.
   */
  private readonly open: boolean

  /**
   * Constructs a NoopRateLimiter.
   *
   * @param open `true` admits every caller, `false` refuses every caller.
   */
  constructor(open = true) {
    this.open = open
  }

  /**
   * Admits or refuses, per the constructor.
   *
   * @returns Whatever this limiter was constructed to answer.
   */
  public async admit(): Promise<boolean> {
    return this.open
  }

  /**
   * Never available.
   *
   * @returns `false`.
   */
  public isAvailable(): boolean {
    return false
  }
}
