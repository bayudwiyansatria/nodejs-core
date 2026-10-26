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
   * `service` has no default, and that is not the same as it being unused.
   * Every line carries one; it comes from `SERVICE_NAME` in the environment,
   * beside the deployment's own name, so both can be updated in the same change.
   * A shared default could leave a deployment logging a stale template name.
   *
   * An application with no environment to read sets `logging.service` in an
   * override instead, and one whose stream carries nothing else can leave both
   * unset.
   */
  logging: {
    level: 'info'
  },

  /**
   * Outbound delivery — ten seconds an attempt, two retries, and a backoff
   * doubling from a quarter of a second. Worst case is a little over thirty
   * seconds, so `timeoutMs` is the one to tighten when callers are less patient
   * than that.
   *
   * `userAgent` is a placeholder, like `logging.service` above. Override it, or
   * the far end's access log says nothing about who is calling.
   */
  delivery: {
    timeoutMs: 10000,
    retries: 2,
    retryBackoffMs: 250,
    userAgent: 'app'
  },

  /**
   * Security — API-key authentication on `/api/v1/*`, with the documentation
   * routes left public. Nothing is exempted and every origin is allowed, so a
   * project opts into both by naming them; see `SecuritySettings`.
   */
  security: {
    urlPattern: '/api/v1/*',
    publicRoutes: ['/swagger-ui/*', '/v3/api-docs/*'],
    excludedRoutes: [],
    allowedOrigins: []
  }
}
