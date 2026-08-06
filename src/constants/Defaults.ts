import { SystemConfiguration } from '@/types/SystemConfiguration'

/**
 * @constant
 *
 * Default settings for the kernel.
 *
 * @remarks
 * What an application logs and protects when it overrides nothing. Anything a
 * platform resource settles — a binding name, a TTL, a model, a connection
 * string — belongs to an adapter package instead, and the application merges
 * both halves when it calls {@link configure}.
 *
 * Nothing here is application-specific. Anything that is belongs in an override.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export const systemDefaults: SystemConfiguration = {
  /**
   * Logging — structured lines to the runtime's log stream at `info` and above.
   * `LOG_LEVEL` in the environment overrides this per deployment.
   *
   * `service` is the field every application is expected to override; it names
   * the emitter in the logstream, and the placeholder here is deliberately
   * generic so an un-overridden deployment reads as unconfigured rather than as
   * some other project.
   */
  logging: {
    level: 'info',
    service: 'app'
  },

  /**
   * Security — API-key authentication on `/api/v1/*`, with the documentation
   * routes left public. Nothing is exempted and every origin is allowed, so a
   * project opts into both by naming them; see `SecuritySettings`.
   */
  security: {
    urlPattern: '/api/v1/*',
    publicRoutes: [
      '/swagger-ui/*', 
      '/v3/api-docs/*'
    ],
    excludedRoutes: [],
    allowedOrigins: []
  }
}
