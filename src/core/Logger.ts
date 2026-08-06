import { resolve } from '@/core/resolve'
import { Time } from '@/utils/Time'

import type { LogContext } from '@/types/logging/LogContext'

import type { LoggingSettings } from '@/types/LoggingSettings'
import type { LogLevel } from '@/types/logging/LogLevel'

/**
 * Relative weight of each level, used to apply the threshold.
 *
 * @remarks
 * `LogLevel` is declared in [`types/`](../types/index.ts) and imported as a type
 * only. Keeping the runtime value here — rather than an enum shared with the
 * configuration layer — is what stops `Logger → resolve → Defaults → Logger`
 * from becoming a real import cycle.
 */
const WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
}

/**
 * @class
 *
 * Structured, level-classified logging — and nothing else.
 *
 * Each line is one JSON object emitted through the matching `console.*` method,
 * so the runtime's log collector records the native level and keeps the fields
 * searchable. Nothing here aggregates — that is {@link TelemetrySink}, a
 * separate capability, because a sink samples at volume and is the wrong place
 * for lines that have to be read back verbatim.
 *
 * @remarks
 * The threshold comes from the surface registered by {@link configure}, and
 * `LOG_LEVEL` in the environment overrides it per deployment, so staging can run
 * at `debug` without a code change.
 *
 * Retention is the runtime's business, not this class's — it writes lines and
 * stops there. Whether they are kept, and for how long, is a deployment setting
 * wherever the process runs.
 *
 * @example
 * ```ts
 * const log = Logger.fromEnv(env, { service: 'ArticleService' })
 * log.info('article created', { id })
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export class Logger {
  /**
   * Minimum weight a line must carry to be emitted.
   */
  private readonly threshold: number

  /**
   * Fields repeated on every line.
   */
  private readonly context: LogContext

  /**
   * Constructs a Logger.
   *
   * @param threshold Minimum weight to emit.
   * @param context Fields repeated on every line.
   */
  private constructor(threshold: number, context: LogContext) {
    this.threshold = threshold
    this.context = context
  }

  /**
   * Builds a logger for the current environment.
   *
   * @remarks
   * The parameter is structural rather than a named environment type. All this
   * needs is a possible `LOG_LEVEL`, so asking for exactly that keeps the kernel
   * free of any platform's environment shape — a runtime's `Env` object, a
   * `process.env`, or a bare object literal all satisfy it.
   *
   * @param env Anything carrying an optional `LOG_LEVEL`. Tolerates `null`.
   * @param context Fields to repeat on every line.
   * @returns A logger honouring the configured (or `LOG_LEVEL`) threshold.
   */
  public static fromEnv(env: { LOG_LEVEL?: string } | null | undefined, context: LogContext = {}): Logger {
    const settings = resolve<LoggingSettings>('logging')
    const level = Logger.parse(env && env.LOG_LEVEL) || settings.level

    return new Logger(WEIGHT[level], { service: settings.service, ...context })
  }

  /**
   * Derives a logger with extra context, sharing this one's threshold.
   *
   * @param context Fields to add to every line.
   * @returns The derived logger.
   */
  public child(context: LogContext): Logger {
    return new Logger(this.threshold, { ...this.context, ...context })
  }

  /**
   * Emits a `debug` line.
   *
   * @param message What happened.
   * @param data Structured detail.
   */
  public debug(message: string, data?: Record<string, unknown>): void {
    this.emit('debug', message, data)
  }

  /**
   * Emits an `info` line.
   *
   * @param message What happened.
   * @param data Structured detail.
   */
  public info(message: string, data?: Record<string, unknown>): void {
    this.emit('info', message, data)
  }

  /**
   * Emits a `warn` line.
   *
   * @param message What happened.
   * @param data Structured detail.
   */
  public warn(message: string, data?: Record<string, unknown>): void {
    this.emit('warn', message, data)
  }

  /**
   * Emits an `error` line.
   *
   * @param message What happened.
   * @param data Structured detail.
   */
  public error(message: string, data?: Record<string, unknown>): void {
    this.emit('error', message, data)
  }

  /**
   * Writes one line through the `console` method matching its level.
   *
   * @param level Severity of the line.
   * @param message What happened.
   * @param data Structured detail.
   */
  private emit(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (WEIGHT[level] < this.threshold) {
      return
    }

    const line = JSON.stringify({
      level,
      message,
      time: Time.nowIso(),
      ...this.context,
      ...(data ? { data: Logger.serialize(data) } : {})
    })

    switch (level) {
      case 'error':
        console.error(line)
        break
      case 'warn':
        console.warn(line)
        break
      case 'debug':
        console.debug(line)
        break
      default:
        console.info(line)
    }
  }

  /**
   * Parses a level name, ignoring anything unrecognised.
   *
   * @param value The candidate level name.
   * @returns The level, or `null` when the value is not one.
   */
  private static parse(value?: string): LogLevel | null {
    const level = (value || '').toLowerCase()

    return (Object.keys(WEIGHT) as string[]).includes(level) ? (level as LogLevel) : null
  }

  /**
   * Makes a data payload serialisable — `Error` values in particular, which
   * `JSON.stringify` would otherwise flatten to `{}`.
   *
   * @param data The payload to convert.
   * @returns The payload with errors expanded to message and stack.
   */
  private static serialize(data: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
      out[key] = value instanceof Error ? { message: value.message, stack: value.stack } : value
    }

    return out
  }
}
