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
   * Optional: with neither set, a line carries no `service` at all — right for
   * a process whose stream carries nothing else, wrong for anything sharing a
   * sink.
   */
  service?: string
}
