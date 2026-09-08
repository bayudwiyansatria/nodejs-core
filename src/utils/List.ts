/**
 * @class
 *
 * Array helpers used where a batch has a ceiling.
 *
 * @remarks
 * Pure functions over their arguments: no bindings, no configuration, no `Env`.
 * They are here rather than in a consumer because nothing in them knows what the
 * elements are — the same partition serves a database batch, a request fan-out
 * and a rate-limited queue.
 *
 * @example
 * ```ts
 * List.chunk([1, 2, 3, 4, 5], 2) // [[1, 2], [3, 4], [5]]
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.3.0
 * @since 1.3.0
 */
export class List {
  /**
   * Splits a list into consecutive runs of at most `size`.
   *
   * @remarks
   * Written for the case where a downstream call has a ceiling on how much it
   * will take at once — a database batch bounded by statements or bound
   * parameters, an API bounded by ids per request — and the caller knows that
   * ceiling while this function does not. The bound is the caller's to name.
   *
   * ## A `size` below one is treated as one
   *
   * Two behaviours were in production before this function was shared, and they
   * disagreed exactly here: one clamped the step to `1`, the other returned the
   * whole input as a single run. The second breaks the only promise the function
   * makes — that no run is longer than `size` — and breaks it in the worst
   * direction, handing an unbounded batch to a caller that asked for a bounded
   * one, which fails at the far end where the ceiling actually lives.
   *
   * Clamping keeps the promise. A misconfigured `0` becomes many small runs:
   * slow, obvious, and correct. Anything that is not a finite number of one or
   * more is treated the same way — `NaN` from a missing environment variable,
   * `Infinity`, a negative — because every one of them is a configuration fault,
   * and the safe reading of a fault is the smallest batch rather than the largest.
   * A non-integer is truncated: a step of `2.5` would otherwise slice at drifting
   * boundaries.
   *
   * @typeParam T The element type, which this does not inspect.
   * @param values The list to split. Not modified.
   * @param size Maximum length of each run. Anything that is not a finite number
   *   of one or more is treated as one.
   * @returns The runs, in order. Empty when `values` is empty.
   */
  public static chunk<T>(values: readonly T[], size: number): T[][] {
    const requested = Math.trunc(size)
    const step = Number.isFinite(requested) && requested > 1 ? requested : 1
    const runs: T[][] = []

    for (let index = 0; index < values.length; index += step) {
      runs.push(values.slice(index, index + step))
    }

    return runs
  }
}
