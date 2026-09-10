/**
 * @module
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.3.0
 */
/**
 * JSON helpers for untrusted input.
 *
 * @remarks
 * A request body is whatever the client sent. `JSON.parse` answers that with an
 * exception, which pushes a `try`/`catch` into every route that reads a body;
 * these helpers answer with a value instead, so a handler can decide the status
 * code in one line.
 *
 * Pure, vendor-neutral, and previously written identically in two consumers —
 * which is the test this module's own remarks set for belonging here rather than
 * in an application.
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
 * @class
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.3.0
 */
export class Json {
  /**
   * Parses JSON without throwing.
   *
   * @remarks
   * `null` covers every way the input can fail to be a usable object —
   * malformed syntax, an empty body, or a bare `null` literal — because none of
   * them is something a handler can act on differently.
   *
   * @typeParam T The expected shape. Unverified: this parses, it does not
   *   validate. The caller checks the fields it needs on the parsed value.
   * @param text The raw text to parse.
   * @returns The parsed value, or `null` when the text is not usable JSON.
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
