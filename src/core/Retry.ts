import { resolve } from '@/core/resolve'

import type { DeliverySettings } from '@/types/DeliverySettings'
import type { RetryOptions } from '@/core/RetryOptions'

/**
 * HTTP statuses worth trying again.
 *
 * @remarks
 * Rate limiting and the gateway family. Any other 4xx is the far end saying the
 * request itself was wrong, and repeating it unchanged asks the same question
 * again — so `400` and `404` are absent on purpose.
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
 * A bounded retry with exponential backoff.
 *
 * @remarks
 * Bounded is the load-bearing word. A scheduled job runs against a wall-clock
 * budget, and an unbounded retry turns one unreachable dependency into an
 * invocation that never ends.
 *
 * ## Why it is in the kernel
 *
 * The kernel has declared the retry *policy* since 1.1.0: `delivery.retries` and
 * `delivery.retryBackoffMs` are in {@link systemDefaults}. Until this class,
 * nothing in the package read them, so every consumer that wanted to honour them
 * had to write the loop that does. This is that loop, beside the settings it
 * reads.
 *
 * It reads them **inside** each call rather than at module scope. Resolving at
 * module scope runs before the application's {@link configure} and throws
 * {@link ConfigurationError} on startup.
 *
 * ## What it does not know
 *
 * Nothing here names a transport. The default judgement recognises an HTTP
 * failure by shape — an `Error` carrying a numeric `status` — rather than by
 * class, so this package takes no dependency on the client that threw it. A
 * caller with its own non-retryable failures, such as a validation error,
 * supplies `isRetryable` and defers to {@link Retry.isRetryable} for the rest.
 *
 * Retry only what is safe to repeat. Replaying an operation that writes needs
 * that write to be idempotent, which is a promise this class cannot make for
 * the caller.
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
