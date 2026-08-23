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
 * ## An event name, not a sentence
 *
 * The first argument is an **event name** — a stable, lowercase, dotted
 * identifier such as `notification.sent` or `external_api.error` — and it is
 * emitted under the `event` key. A collector that indexes JSON fields turns
 * that key into a column, so `event = notification.failed` becomes a filter
 * rather than a substring search, and the count of one event over time becomes
 * a series. A prose message can be neither: `'Failed to send notification for
 * user 7'` is a different string on every line it is written.
 *
 * Anything that varies belongs in `data`, where it stays structured and
 * searchable on its own.
 *
 * ## Every line says who wrote it
 *
 * `service` names the deployment and is stamped on every line, from
 * `SERVICE_NAME` in the environment or, failing that, `logging.service` on the
 * configuration surface.
 *
 * A runtime often knows this already — Cloudflare Workers Logs records the
 * script name on the invocation and offers it as a column — and stamping it
 * here is a deliberate second copy. The reason is that the copy travels: a line
 * exported to a file, shipped through Logpush, or read on a runtime that has no
 * such column still says which service produced it. A record that only makes
 * sense inside one vendor's console is not a record. The cost is a field that
 * can drift from the deployment, which is why the value comes from the
 * environment rather than a constant compiled into the bundle.
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
 * log.info('article.created', { id })
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.2.0
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
   * needs is a possible `LOG_LEVEL` and `SERVICE_NAME`, so asking for exactly
   * that keeps the kernel free of any platform's environment shape — a
   * runtime's `Env` object, a `process.env`, or a bare object literal all
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
   * @param env Anything carrying an optional `LOG_LEVEL` and `SERVICE_NAME`.
   *   Tolerates `null`.
   * @param context Fields to repeat on every line.
   * @returns A logger honouring the configured (or `LOG_LEVEL`) threshold.
   */
  public static fromEnv(
    env: { LOG_LEVEL?: string; SERVICE_NAME?: string } | null | undefined,
    context: LogContext = {}
  ): Logger {
    const settings = resolve<LoggingSettings>('logging')
    const level = Logger.parse(env && env.LOG_LEVEL) || settings.level
    const named = (env && env.SERVICE_NAME) || settings.service
    const service = Text.isBlank(named) ? UNNAMED : (named as string)

    return new Logger(WEIGHT[level], { service, ...context })
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
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   */
  public debug(event: string, data?: Record<string, unknown>): void {
    this.emit('debug', event, data)
  }

  /**
   * Emits an `info` line.
   *
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   */
  public info(event: string, data?: Record<string, unknown>): void {
    this.emit('info', event, data)
  }

  /**
   * Emits a `warn` line.
   *
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   */
  public warn(event: string, data?: Record<string, unknown>): void {
    this.emit('warn', event, data)
  }

  /**
   * Emits an `error` line.
   *
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   */
  public error(event: string, data?: Record<string, unknown>): void {
    this.emit('error', event, data)
  }

  /**
   * Writes one line through the `console` method matching its level.
   *
   * @param level Severity of the line.
   * @param event What happened, as a dotted event name.
   * @param data Structured detail.
   */
  private emit(level: LogLevel, event: string, data?: Record<string, unknown>): void {
    if (WEIGHT[level] < this.threshold) {
      return
    }

    const line = JSON.stringify({
      level,
      event,
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
