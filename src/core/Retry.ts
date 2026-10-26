import { resolve } from '@/core/resolve'

import type { DeliverySettings } from '@/types/DeliverySettings'
import type { RetryOptions } from '@/core/RetryOptions'

/**
 * HTTP statuses eligible for retry by the default policy.
 */
const TRANSIENT_STATUS: ReadonlySet<number> = new Set([429, 500, 502, 503, 504])

/**
 * Waits for a number of milliseconds.
 *
 * @param ms How long to wait.
 * @returns A promise that settles after the delay.
 */
const sleep = (ms: number): Promise<void> => new Promise(done => setTimeout(done, ms))

/**
 * @class
 *
 * Retries an operation with a bounded attempt count and exponential backoff.
 *
 * @remarks
 * Reads `delivery.retries` and `delivery.retryBackoffMs` inside each call, after
 * application configuration. Callers can override either setting in RetryOptions.
 *
 * The default policy identifies HTTP failures by an Error's numeric `status`
 * field. Supply `isRetryable` for application-specific failures.
 *
 * Operations must be safe to repeat. Callers are responsible for idempotent writes.
 *
 * @example
 * ```ts
 * const body = await Retry.run(() => client.get(url), { logger: log, event: 'rates.retry' })
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.3.1
 * @since 1.3.1
 */
export class Retry {
  /**
   * Runs an operation, retrying failures judged transient.
   *
   * @remarks
   * Backoff doubles: with the shipped defaults that is one attempt, 250 ms, a
   * second, 500 ms, a third. The last failure is rethrown unchanged, so the
   * caller sees the real cause rather than a wrapper.
   *
   * @typeParam T The operation's result.
   * @param operation The work to attempt. Must be safe to run more than once.
   * @param options Overrides for the resolved `delivery` defaults.
   * @returns Whatever the operation returned.
   * @throws The final failure, once the budget is spent or the failure is not retryable.
   * @throws {@link ConfigurationError} When `delivery` is not registered and
   *   either `attempts` or `backoffMs` was left to default.
   */
  public static async run<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
    const delivery =
      options.attempts === undefined || options.backoffMs === undefined
        ? resolve<DeliverySettings>('delivery')
        : undefined

    const attempts = Math.max(Math.trunc(options.attempts ?? delivery.retries + 1) || 1, 1)
    const backoffMs = options.backoffMs ?? delivery.retryBackoffMs
    const retryable = options.isRetryable ?? Retry.isRetryable
    const event = options.event ?? 'retry'

    let failure: unknown

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await operation()
      } catch (error) {
        failure = error

        if (attempt === attempts || !retryable(error)) {
          break
        }

        const delayMs = backoffMs * 2 ** (attempt - 1)

        options.logger?.warn(
          event,
          { attempt, of: attempts, delayMs, error },
          `Attempt ${attempt} of ${attempts} failed, retrying in ${delayMs}ms`
        )

        await sleep(delayMs)
      }
    }

    throw failure
  }

  /**
   * The default judgement on whether a failure is transient.
   *
   * @remarks
   * An abort or a timeout is not retryable: the caller's own timeout already
   * spent the budget it allowed.
   *
   * An `Error` with a numeric `status` is read as an HTTP failure, and retried
   * only for `429` and the `5xx` gateway family.
   *
   * Anything else is treated as a network failure and retried, which is the safe
   * reading — `fetch` rejects for DNS, TLS and connection resets, and all three
   * are worth a second look.
   *
   * @param error The thrown value.
   * @returns `true` when another attempt is reasonable.
   */
  public static isRetryable(error: unknown): boolean {
    if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')) {
      return false
    }

    const status = error instanceof Error ? (error as Error & { status?: unknown }).status : undefined

    if (typeof status === 'number') {
      return TRANSIENT_STATUS.has(status)
    }

    return true
  }
}
