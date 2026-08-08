import type { DeliverySettings } from '@/types/DeliverySettings'
import type { LoggingSettings } from '@/types/LoggingSettings'
import type { SecuritySettings } from '@/types/SecuritySettings'

/**
 * @interface
 *
 * The kernel half of the configuration surface.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.1.0
 * @since 1.0.0
 */
export interface SystemConfiguration {
  /**
   * Outbound HTTP delivery, to services this application does not control.
   */
  delivery: DeliverySettings

  /**
   * Logging, over the runtime's log stream.
   */
  logging: LoggingSettings

  /**
   * Security middleware.
   */
  security: SecuritySettings
}
