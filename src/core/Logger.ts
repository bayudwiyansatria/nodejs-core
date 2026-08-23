import { LogFields } from '@/core/LogFields'
import { redact } from '@/security/redact'
import { resolve } from '@/core/resolve'
import { Text } from '@/utils/Text'
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
 * What `service` reads when nothing names the deployment.
 *
 * @remarks
 * A marker rather than an omitted field, and the distinction is the whole
 * reason it exists. Every line is supposed to say which service wrote it, so
 * that it still means something once it has left the console it was written to.
 * A deployment that forgets to set `SERVICE_NAME` breaks that guarantee, and an
 * absent key breaks it *invisibly* — the lines look ordinary, the Worker looks
 * healthy, and nothing surfaces until someone needs to tell two services apart
 * in one stream and cannot.
 *
 * This turns that into something a query finds: `service = unknown` returns
 * every misconfigured deployment in the account.
 */
const UNNAMED = 'unknown'

/**
 * Keys the line owns, which nothing else may occupy.
 *
 * @remarks
 * Context and payload are both merged onto the line, and either could carry a
 * key named `level` or `message` — a forwarded upstream record especially,
 * where those names are exactly what a log line calls its own fields. Letting
 * one through would leave a line whose severity disagrees with the stream it
 * was written to, which is worse than losing the field: a collector indexes the
 * value it sees, so an `error` payload could arrive filed as `info` and never
 * surface in a severity filter.
 *
 * These three are written first and re-asserted against every merged key.
 */
const RESERVED = new Set(['level', 'event', 'message'])

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
 * ## An event name *and* a sentence
 *
 * The first argument is an **event name** — a stable, lowercase, dotted
 * identifier such as `notification.sent` or `external_api.error` — emitted
 * under the `event` key. A collector that indexes JSON fields turns that key
 * into a column, so `event = notification.failed` becomes a filter rather than
 * a substring search, and the count of one event over time becomes a series. A
 * prose sentence can be neither: `'Failed to send notification for user 7'` is
 * a different string on every line it is written.
 *
 * That is why the third argument exists rather than replacing the first. A
 * `message` is written for whoever is *reading* the stream, and it is the only
 * thing most log viewers show by default. Omit it and the event name stands in,
 * so the column is never empty; supply it and the line says something in
 * English without anyone opening it:
 *
 * ```ts
 * log.warn('external_api.error', { provider, status }, `Telegram rejected the send (${status})`)
 * ```
 *
 * Anything that varies belongs in the payload, where it stays structured and
 * searchable on its own — never interpolated into the event name.
 *
 * ## One flat object
 *
 * Context and payload are flattened onto the line, not nested under a wrapper,
 * so a field is indexed as `status` rather than `data.status`.
 *
 * Context passes through an allow-list first; see `LogFields`. Payload never
 * does — it was named at the call site for this one call, and dropping it there
 * would discard the answer somebody logged the line to get.
 *
 * ## Which deployment wrote it
 *
 * `service` names the deployment, from `SERVICE_NAME` in the environment or,
 * failing that, `logging.service` on the configuration surface. It is context,
 * so it reaches the line only while the allow-list admits it — which the kernel
 * default does.
 *
 * Some runtimes already record it: Cloudflare stamps the script name on every
 * log record before it is stored, so a Worker that never leaves that console
 * gains nothing from a second copy and can drop the field. A deployment whose
 * lines *travel* — exported to a file, shipped through Logpush, read on a
 * runtime with no such column — should keep it, because a record that only
 * makes sense inside one vendor's console is not a record.
 *
 * That is the trade the allow-list exists to let a deployment make, rather than
 * this class making it for every consumer. The value comes from the environment
 * rather than a constant compiled into the bundle, so whichever way it is
 * decided the name cannot drift from the deployment it describes.
 *
 * `service` answers *which service*; a line that needs to say which part of it
 * ran names a `component` in the context.
 *
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
