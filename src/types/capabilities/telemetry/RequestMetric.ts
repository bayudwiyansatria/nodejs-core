/**
 * @interface
 *
 * One request measurement.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface RequestMetric {
  /**
   * Route or path — the key metrics are grouped by.
   */
  route: string

  /**
   * HTTP method.
   */
  method: string

  /**
   * Response status.
   */
  status: number

  /**
   * How long the request took, in milliseconds.
   */
  durationMs: number

  /**
   * Point of presence that served the request, where the runtime reports one.
   */
  colo?: string

  /**
   * Country the request came from, where the runtime reports one.
   */
  country?: string
}
