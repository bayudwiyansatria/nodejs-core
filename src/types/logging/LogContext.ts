/**
 * @interface
 *
 * Ambient fields attached to every line a logger emits.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface LogContext {
  /**
   * Correlates every line produced while handling one request.
   */
  requestId?: string

  /**
   * Which part of the application emitted the line.
   */
  service?: string

  /**
   * HTTP method of the request being handled.
   */
  method?: string

  /**
   * Path of the request being handled.
   */
  path?: string

  /**
   * Any other ambient field worth repeating on every line.
   */
  [key: string]: unknown
}
