import { LogFields } from '@/core/LogFields'
import { redact } from '@/security/redact'
import { resolve } from '@/core/resolve'
import { Text } from '@/utils/Text'
import { Time } from '@/utils/Time'

import type { LogContext } from '@/types/logging/LogContext'
import type { LoggingSettings } from '@/types/LoggingSettings'
import type { LogLevel } from '@/types/logging/LogLevel'

/**
 * Relative weight of each severity level.
 *
 * The type lives in types/ so configuration can use it without importing Logger.
 */
const WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
}

/**
 * Fallback service name, making missing deployment configuration searchable.
 */
const UNNAMED = 'unknown'

/**
 * Fields that context and payload must not overwrite.
 */
const RESERVED = new Set(['level', 'event', 'message'])

/**
 * @class
 *
 * Writes structured JSON through the console method matching each severity level.
 *
 * @remarks
 * Use a stable, dotted event name such as `article.created`. Put variable values
 * in the payload and an optional human-readable sentence in the third argument.
 * When omitted, the message defaults to the event name.
 *
 * Context and payload fields are flattened onto each line. The field allow-list
 * filters context only; explicit payload fields remain available. Neither may
 * overwrite `level`, `event`, or `message`.
 *
 * `LOG_LEVEL`, `SERVICE_NAME`, and `LOG_FIELDS` override the registered logging
 * settings. With no service name, lines use `unknown`. A child logger adds context
 * while keeping its parent's threshold and field selection.
 *
 * Payloads pass through redaction, then top-level Error values expand to message
 * and stack. The runtime controls log collection and retention.
 *
 * @example
 * ```ts
 * const log = Logger.fromEnv(env, { component: 'ArticleService' })
 *
 * log.info('article.created', { id })
 * log.info('article.created', { id }, `Article ${id} created`)
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.2.1
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
   * Which of those fields the deployment actually wants ingested.
   */
  private readonly fields: LogFields

  /**
   * Constructs a Logger.
   *
   * @param threshold Minimum weight to emit.
   * @param context Fields repeated on every line.
   * @param fields Which context fields reach the line.
   */
  private constructor(threshold: number, context: LogContext, fields: LogFields) {
    this.threshold = threshold
    this.context = context
    this.fields = fields
  }

  /**
   * Builds a logger for the current environment.
   *
   * @remarks
   * The parameter is structural rather than a named environment type. All this
   * needs is a possible `LOG_LEVEL`, `SERVICE_NAME` and `LOG_FIELDS`, so asking
   * for exactly that keeps the kernel free of any platform's environment shape
   * — a runtime's `Env` object, a `process.env`, or a bare object literal all
   * satisfy it.
   *
   * The service name is read from the environment first and the configuration
   * surface second. The order is the point: a name in the environment sits
   * beside the deployment's own name — in `wrangler.json`, two lines below
   * `"name"` — where a rename that misses it shows up in the same diff. A name
   * compiled into the bundle from `config/` sits in a different file that a
   * rename does not touch, which is how a Worker came to spend production
   * calling itself `cloudflare-boilerplate`. The configuration value remains
   * the fallback for runtimes with no environment to read.
   *
   * With neither set the line still carries a `service`, reading `unknown`. A
   * missing name is a deployment defect, and an omitted key would make it an
   * invisible one — `service = unknown` is a query that finds every
   * misconfigured deployment.
   *
   * @param env Anything carrying an optional `LOG_LEVEL`, `SERVICE_NAME` and
   *   `LOG_FIELDS`. Tolerates `null`.
   * @param context Fields to repeat on every line.
   * @returns A logger honouring the configured (or `LOG_LEVEL`) threshold, and
   *   emitting the context fields the deployment declared.
   */
  public static fromEnv(
    env: { LOG_LEVEL?: string; SERVICE_NAME?: string; LOG_FIELDS?: string } | null | undefined,
    context: LogContext = {}
  ): Logger {
    const settings = resolve<LoggingSettings>('logging')
    const level = Logger.parse(env && env.LOG_LEVEL) || settings.level
    const named = (env && env.SERVICE_NAME) || settings.service
    const service = Text.isBlank(named) ? UNNAMED : (named as string)

    return new Logger(WEIGHT[level], { service, ...context }, LogFields.fromEnv(env))
  }

  /**
   * Derives a logger with extra context, sharing this one's threshold.
   *
   * @param context Fields to add to every line.
   * @returns The derived logger.
   */
  public child(context: LogContext): Logger {
    return new Logger(this.threshold, { ...this.context, ...context }, this.fields)
  }

  /**
   * Emits a `debug` line.
   *
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   * @param message A sentence for someone reading the stream. Defaults to the
   *   event name.
   */
  public debug(event: string, data?: Record<string, unknown>, message?: string): void {
    this.emit('debug', event, data, message)
  }

  /**
   * Emits an `info` line.
   *
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   * @param message A sentence for someone reading the stream. Defaults to the
   *   event name.
   */
  public info(event: string, data?: Record<string, unknown>, message?: string): void {
    this.emit('info', event, data, message)
  }

  /**
   * Emits a `warn` line.
   *
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   * @param message A sentence for someone reading the stream. Defaults to the
   *   event name.
   */
  public warn(event: string, data?: Record<string, unknown>, message?: string): void {
    this.emit('warn', event, data, message)
  }

  /**
   * Emits an `error` line.
   *
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   * @param message A sentence for someone reading the stream. Defaults to the
   *   event name.
   */
  public error(event: string, data?: Record<string, unknown>, message?: string): void {
    this.emit('error', event, data, message)
  }

  /**
   * Writes one line through the `console` method matching its level.
   *
   * @remarks
   * Context and payload are both flattened onto the line rather than nested,
   * so a collector indexes `status` rather than `data.status` and a dashboard
   * column reads as a field name instead of a path.
   *
   * They are not treated alike. Context is ambient — stamped by middleware for
   * the span of a request — and passes through the allow-list, because a
   * deployment should be able to decide it does not want the point of presence
   * on every line. Payload was typed out at the call site for this one call,
   * so it is emitted whole: filtering it would silently discard the answer
   * someone went to the trouble of logging.
   *
   * @param level Severity of the line.
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   * @param message A sentence for someone reading the stream.
   */
  private emit(level: LogLevel, event: string, data?: Record<string, unknown>, message?: string): void {
    if (WEIGHT[level] < this.threshold) {
      return
    }

    const line = JSON.stringify(this.compose(level, event, data, message))

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
   * Assembles the object that becomes the line.
   *
   * @remarks
   * The three reserved keys are written first so a raw line reads
   * level-then-event-then-message, and re-asserted on every merge so nothing
   * can displace them. `time` sits behind the allow-list like any other field:
   * a runtime that stamps its own ingestion timestamp does not need a second
   * one, and it is computed here rather than carried in the context so it
   * records when the line was written and not when the logger was built.
   *
   * @param level Severity of the line.
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   * @param message A sentence for someone reading the stream.
   * @returns The line, ready to serialise.
   */
  private compose(
    level: LogLevel,
    event: string,
    data?: Record<string, unknown>,
    message?: string
  ): Record<string, unknown> {
    const line: Record<string, unknown> = {
      level,
      event,
      message: message === undefined ? event : message
    }

    if (this.fields.permits('time')) {
      line.time = Time.nowIso()
    }

    for (const [key, value] of Object.entries(this.context)) {
      if (!RESERVED.has(key) && this.fields.permits(key)) {
        line[key] = value
      }
    }

    if (data) {
      for (const [key, value] of Object.entries(Logger.serialize(data))) {
        if (!RESERVED.has(key)) {
          line[key] = value
        }
      }
    }

    return line
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
   * Makes a data payload serialisable, and safe to ship.
   *
   * @remarks
   * Two passes for two different problems. `redact` runs first, because a
   * credential must not survive into the line whatever shape it arrived in;
   * then `Error` expansion, which `JSON.stringify` would otherwise flatten to
   * `{}`, losing the only useful part of an error line.
   *
   * The order is load-bearing in one direction only: redaction returns `Error`
   * values untouched precisely so this pass can still recognise them.
   *
   * @param data The payload to convert.
   * @returns The payload scrubbed of secrets, with errors expanded to message
   *   and stack.
   */
  private static serialize(data: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(redact(data))) {
      out[key] = value instanceof Error ? { message: value.message, stack: value.stack } : value
    }

    return out
  }
}
