/**
 * @class
 *
 * Array helpers for splitting work into bounded batches.
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
   * Splits a list into consecutive batches of at most `size` elements.
   *
   * @remarks
   * Fractional sizes are truncated. Non-finite sizes and sizes below one use a
   * batch size of one, keeping invalid configuration from producing an unbounded batch.
   *
   * @typeParam T The element type.
   * @param values The list to split. Not modified.
   * @param size Maximum batch length. Invalid sizes use one.
   * @returns The batches in input order, or an empty array for empty input.
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
