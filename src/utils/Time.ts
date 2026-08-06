/**
 * @class
 *
 * Clock helpers used by the framework layer.
 *
 * @remarks
 * One place that reads the clock, so timestamps agree across a request: the
 * logger stamps every line, the middleware measures duration, and a service
 * records when a row was written. Some runtimes freeze `Date.now()` between I/O operations, so a duration
 * measured across an `await` is wall-clock time around the I/O rather than CPU
 * time.
 *
 * @example
 * ```ts
 * const start = Time.now()
 * await handler()
 * log.info('done', { durationMs: Time.since(start), at: Time.nowIso() })
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export class Time {
  /**
   * Reads the current time in epoch milliseconds.
   *
   * @returns Milliseconds since the epoch.
   */
  public static now(): number {
    return Date.now()
  }

  /**
   * Reads the current time as an ISO 8601 string.
   *
   * @returns The timestamp, e.g. `2026-07-26T09:12:44.031Z`.
   */
  public static nowIso(): string {
    return new Date().toISOString()
  }

  /**
   * Measures how long has passed since a mark taken with {@link Time.now}.
   *
   * @param start The earlier mark, in epoch milliseconds.
   * @returns Elapsed milliseconds, never negative.
   */
  public static since(start: number): number {
    const elapsed = Time.now() - start

    return elapsed > 0 ? elapsed : 0
  }
}
