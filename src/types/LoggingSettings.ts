import type { LogLevel } from '@/types/logging/LogLevel'

/**
 * @interface
 *
 * Logging settings — the severity threshold, and an optional service name.
 *
 * @remarks
 * Logs go to the runtime's own log stream, never to a metrics backend.
 * `LOG_LEVEL` in the environment overrides `level` per deployment.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.2.0
 * @since 1.0.0
 */
export interface LoggingSettings {
  /**
   * Minimum severity to emit.
   */
  level: LogLevel

  /**
   * Name recorded on every line, so one log stream can carry several services.
   *
   * @remarks
   * The **fallback**. `SERVICE_NAME` in the environment is read first, because
   * a name declared beside the deployment cannot drift from it the way a
   * constant in a separate source file can. This is what a runtime with no
   * environment to read falls back to.
   *
   * Optional: with neither set, {@link Logger.fromEnv} records `unknown`. That
   * visible sentinel lets a deployment find and correct missing service names.
   */
  service?: string

  /**
   * Which context fields reach the line.
   *
   * @remarks
   * The **fallback**, below `LOG_FIELDS` in the environment and above the
   * kernel's own default of every field. This is where an adapter narrows the
   * line for a runtime it understands — one that records the service name or
   * the point of presence itself has no use for a second copy — without the
   * kernel having to know which runtime that is.
   *
   * Names the ambient fields only. What a caller passes to a single log call is
   * always emitted.
   */
  fields?: string[]
}
