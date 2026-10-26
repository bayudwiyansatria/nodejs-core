/**
 * @module
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.3.0
 */
/**
 * @class
 *
 * Parses untrusted JSON without throwing on invalid syntax.
 *
 * @remarks
 * Parsing does not validate the result's shape. Callers must check the fields
 * they need, even when they supply a type argument.
 *
 * @example
 * ```ts
 * const input = Json.parse<{ symbol?: string }>(await request.text())
 *
 * if (!input) {
 *   return fail('Body must be valid JSON')
 * }
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.3.0
 */
export class Json {
  /**
   * Parses JSON, returning null for empty input, invalid syntax, or a null literal.
   *
   * @typeParam T The expected shape, which is not validated.
   * @param text The raw text to parse.
   * @returns The parsed value, including valid primitives, or null.
   */
  public static parse<T = unknown>(text: string): T | null {
    if (!text) {
      return null
    }

    try {
      const value = JSON.parse(text)

      return value === null ? null : (value as T)
    } catch {
      return null
    }
  }
}
