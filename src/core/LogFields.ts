import { resolve } from '@/core/resolve'

import type { LoggingSettings } from '@/types/LoggingSettings'

/**
 * The declaration that admits every context field.
 *
 * @remarks
 * The kernel's own default, and the reason it is this rather than a curated
 * list: a package that decided for its consumers which fields matter would be
 * deciding on behalf of runtimes it knows nothing about. Narrowing is an
 * adapter's job — it is the layer that knows what the platform already records
 * and therefore what a line need not repeat.
 */
const EVERY = '*'

/**
 * @class
 *
 * Which context fields reach the log line.
 *
 * @remarks
 * A log line carries two kinds of field, and only one of them is negotiable.
 * *Context* is ambient — the request id, the method, the path, the address —
 * repeated on every line for the span of a request, and stamped by middleware
 * rather than chosen at the call site. *Payload* is what a caller passed to one
 * log call because that call needed it. This governs the first and never the
 * second: a field someone typed out deliberately is not noise to be filtered.
 *
 * The declaration is a comma-separated list, read from `LOG_FIELDS` in the
 * environment first and the configuration surface second — the same order as
 * `LOG_LEVEL`, and for the same reason. A deployment can narrow what it ingests
 * without a rebuild.
 *
 * `*` admits everything and is the kernel default. An empty declaration admits
 * nothing, which is not the same as leaving it unset: `LOG_FIELDS=""` is a
 * deployment saying the level, the event, and the message are the whole line.
 *
 * @example
 * ```ts
 * const fields = LogFields.fromEnv({ LOG_FIELDS: 'requestId,method,path' })
 * fields.permits('requestId') // true
 * fields.permits('colo')      // false
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
