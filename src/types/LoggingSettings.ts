import type { LogLevel } from '@/types/logging/LogLevel'

/**
 * @interface
 *
 * Logging settings — severity threshold and the service name on every line.
 *
 * @remarks
 * Logs go to the runtime's own log stream, never to a metrics backend.
 * `LOG_LEVEL` in the environment overrides `level` per deployment.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface LoggingSettings {
  /**
   * Minimum severity to emit.
   */
  level: LogLevel

  /**
   * Name recorded on every line, so one log stream can carry several services.
   */
  service: string
}
