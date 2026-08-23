/**
 * @interface
 *
 * Ambient fields attached to every line a logger emits.
 *
 * @remarks
 * Ambient means *constant for the span* — the request being handled, the
 * component doing the handling. Anything that varies from one line to the next
 * is the logger's `data` argument instead, and the event name is neither: it is
 * the first argument, and it names what happened.
 *
 * `service` is below but is not normally passed here: {@link Logger.fromEnv}
 * stamps it from the environment on every line it creates. Passing it in
 * overrides that for one logger, which a fan-in — a relay logging on behalf of
 * the service it forwarded for — occasionally wants and nothing else does.
 * Naming a class or a module is what `component` is for.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.2.0
 * @since 1.0.0
 */
export interface LogContext {
  /**
   * Correlates every line produced while handling one request.
   */
  requestId?: string

  /**
   * Which deployment emitted the line.
   *
   * @remarks
   * Stamped by {@link Logger.fromEnv} from `SERVICE_NAME`. Set it here only to
   * override that for one logger.
   */
  service?: string

  /**
   * Which part of the application emitted the line — a class, a module, a
   * background task. The answer to "where in this service", where `service`
   * answers "which service".
   */
  component?: string

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
