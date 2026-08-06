/**
 * @interface
 *
 * What a runtime knows about a request that the request itself does not say.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface RequestFacts {
  /**
   * Correlation id for everything logged while handling this request.
   *
   * A runtime that stamps its own trace id supplies it; otherwise the reader
   * generates one, so this is never empty.
   */
  requestId: string

  /**
   * The client's address, or `unknown` when the runtime does not report one.
   */
  clientIp: string

  /**
   * Point of presence that served the request, where the runtime reports one.
   */
  colo?: string

  /**
   * Country the request came from, where the runtime reports one.
   */
  country?: string
}
