/**
 * @class
 *
 * String helpers used by the framework layer.
 *
 * @remarks
 * Pure functions: no bindings, no configuration, no `Env`. That is what makes
 * them safe to call from anywhere in `core/` — including from
 * [`resolve`](../core/resolve.ts)'s callers, where reaching for anything
 * stateful would reintroduce the cycle the configuration layer avoids.
 *
 * @example
 * ```ts
 * Text.truncate('a-very-long-sampling-key', 96)
 * Text.trim(input.title) // '' for null, undefined, or whitespace
 * Text.isBlank(input.body)
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export class Text {
  /**
   * Shortens a value to a maximum length.
   *
   * @remarks
   * Telemetry backends commonly cap an index or dimension by length and reject
   * an oversized write outright rather than truncating it for you.
   *
   * @param value The value to shorten.
   * @param max Maximum number of characters to keep.
   * @returns The value, cut to `max` characters.
   */
  public static truncate(value: string, max: number): string {
    const text = value || ''

    return text.length > max ? text.slice(0, max) : text
  }

  /**
   * Trims a value that may not be there.
   *
   * @param value The value to trim.
   * @returns The trimmed value, or an empty string when it was absent.
   */
  public static trim(value?: string | null): string {
    return (value || '').trim()
  }

  /**
   * Reports whether a value is missing or contains only whitespace.
   *
   * @param value The value to test.
   * @returns `true` when there is nothing meaningful in it.
   */
  public static isBlank(value?: string | null): boolean {
    return Text.trim(value).length === 0
  }
}
