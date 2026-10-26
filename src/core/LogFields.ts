import { resolve } from '@/core/resolve'

import type { LoggingSettings } from '@/types/LoggingSettings'

/**
 * Declaration that admits every context field.
 */
const EVERY = '*'

/**
 * @class
 *
 * Selects which ambient context fields reach a log line.
 *
 * @remarks
 * Reads the comma-separated `LOG_FIELDS` declaration before the configured
 * `logging.fields` fallback. A star admits everything; an empty declaration
 * admits nothing. An unset declaration uses the configured fields, or all fields
 * when no fallback is registered.
 *
 * This selection applies to context only. Payload fields passed to an individual
 * log call are always retained.
 *
 * @example
 * ```ts
 * const fields = LogFields.fromEnv({ LOG_FIELDS: 'requestId,method,path' })
 *
 * fields.permits('requestId') // true
 * fields.permits('colo') // false
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.2.1
 * @since 1.2.1
 */
export class LogFields {
  /**
   * The admitted names, or `null` when every field is admitted.
   */
  private readonly allowed: Set<string> | null

  /**
   * Constructs a LogFields.
   *
   * @param allowed The admitted names, or `null` to admit every field.
   */
  private constructor(allowed: Set<string> | null) {
    this.allowed = allowed
  }

  /**
   * Reads the declaration for the current environment.
   *
   * @remarks
   * `LOG_FIELDS` is checked for being *declared*, not for being truthy, because
   * an empty string is a meaningful declaration — it means "no context fields"
   * — and would otherwise fall through to the surface and quietly emit more
   * than the deployment asked for.
   *
   * @param env Anything carrying an optional `LOG_FIELDS`. Tolerates `null`.
   * @returns The resolved allow-list.
   */
  public static fromEnv(env: { LOG_FIELDS?: string } | null | undefined): LogFields {
    const declared = env ? env.LOG_FIELDS : undefined

    if (declared !== undefined) {
      return LogFields.parse(declared)
    }

    const settings = resolve<LoggingSettings>('logging')

    return settings.fields ? LogFields.parse(settings.fields.join(',')) : new LogFields(null)
  }

  /**
   * Whether a context field reaches the line.
   *
   * @param name The field name.
   * @returns True when the field is admitted.
   */
  public permits(name: string): boolean {
    return this.allowed === null || this.allowed.has(name)
  }

  /**
   * Reads a comma-separated declaration.
   *
   * @param value The declaration, such as `requestId,method,path`.
   * @returns The allow-list it describes.
   */
  private static parse(value: string): LogFields {
    if (value.trim() === EVERY) {
      return new LogFields(null)
    }

    const names = value
      .split(',')
      .map(name => name.trim())
      .filter(name => name.length > 0)

    return new LogFields(new Set(names))
  }
}
