/**
 * @interface
 *
 * The response envelope every endpoint returns.
 *
 * @remarks
 * Services build this through {@link Service.ok} and
 * {@link Service.fail} rather than assembling it by hand, which is
 * what lets a controller map `success` onto a status code without reading the
 * service it called.
 *
 * @example
 * ```json
 * { "message": "Article found", "success": true, "data": { "id": 1 } }
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface APIResponse {
  /**
   * Human-readable description of the outcome, safe to show a client.
   */
  message: string

  /**
   * Whether the request did what the caller asked for.
   *
   * `false` marks an outcome the caller can act on — a missing record, invalid
   * input. Faults they cannot act on throw instead, and surface as a `500`.
   */
  success: boolean

  /**
   * The payload, or `null` when there is nothing to return.
   *
   * Deliberately untyped: the shape belongs to the endpoint, and the controller
   * is the layer that knows it.
   */
  data: any
}
