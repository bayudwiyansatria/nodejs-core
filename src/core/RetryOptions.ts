import type { Logger } from '@/core/Logger'

/**
 * @interface
 *
 * What one retried operation may override.
 *
 * @remarks
 * Every field is optional. The attempt count and the backoff default to the
 * `delivery` module, which {@link systemDefaults} registers with `retries` and
 * `retryBackoffMs`, so a deployment tunes every retry in one place and a call
 * site overrides only what is genuinely different about its operation.
 *
 * Declared beside {@link Retry} in `core/` rather than in `types/`, because it
 * names {@link Logger}, and the leaf layers do not import from `core/`.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.3.1
 * @since 1.3.1
 */
export interface RetryOptions {
  /**
   * Total attempts, including the first. Anything below one is treated as one.
   *
   * @defaultValue `delivery.retries + 1`
   */
  attempts?: number

  /**
   * Delay before the second attempt, in milliseconds, doubling thereafter.
   *
   * @defaultValue `delivery.retryBackoffMs`
   */
  backoffMs?: number

  /**
   * Whether a given failure is worth another attempt.
   *
   * @remarks
   * Replaces the default judgement rather than adding to it. A caller that only
   * wants to refuse one more kind of failure should return `false` for it and
   * defer to {@link Retry.isRetryable} for everything else.
   *
   * @defaultValue {@link Retry.isRetryable}
   */
  isRetryable?(error: unknown): boolean

  /**
   * Receives one `warn` line before each re-attempt.
   *
   * @remarks
   * Omitted means retries are silent, which is rarely what an operator wants:
   * a source that only succeeds on its third attempt looks healthy from the
   * outside, and these lines are the only evidence that it is not.
   */
  logger?: Logger

  /**
   * The event name those lines carry.
   *
   * @defaultValue `'retry'`
   */
  event?: string
}
