/**
 * @interface
 *
 * Outbound HTTP delivery settings — how hard an application tries when it posts
 * to a service it does not control.
 *
 * @remarks
 * The one settings module with no platform resource behind it. A `fetch` to
 * somebody else's endpoint needs a policy just as much as a binding does, and
 * leaving one hard-coded in a service is how a timeout becomes a redeploy.
 *
 * It sits in the kernel rather than an adapter because none of it names a
 * vendor.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.1.0
 * @since 1.1.0
 */
export interface DeliverySettings {
  /**
   * How long a single attempt may take before it is abandoned, in
   * milliseconds.
   */
  timeoutMs: number

  /**
   * How many times to retry after the first attempt fails retryably.
   *
   * Zero means one attempt and no more.
   */
  retries: number

  /**
   * Base backoff between attempts, in milliseconds. Doubles per retry.
   *
   * @remarks
   * Backoff is spent inside the request that triggered the delivery, so the
   * caller waits for it — keep the product of this, the doubling, and
   * {@link retries} well inside the client's own timeout.
   */
  retryBackoffMs: number

  /**
   * `User-Agent` sent on every delivery, so the receiving service can tell
   * which system is posting to it.
   */
  userAgent: string
}
