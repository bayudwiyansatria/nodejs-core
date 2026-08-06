import type { LoggingSettings } from '@/types/LoggingSettings'
import type { SecuritySettings } from '@/types/SecuritySettings'

/**
 * @interface
 *
 * The kernel half of the configuration surface.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface SystemConfiguration {
  /**
   * Logging, over the runtime's log stream.
   */
  logging: LoggingSettings

  /**
   * Security middleware.
   */
  security: SecuritySettings
}
