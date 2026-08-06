import { TelemetrySink } from '@/types/capabilities/telemetry/TelemetrySink'

/**
 * @class
 *
 * A telemetry sink that records nothing.
 *
 * @remarks
 * Reports `false` from every write, the same answer a real sink gives when its
 * backend is unbound or metrics are switched off — so a caller that logs the
 * difference keeps logging it, and one that ignores it keeps working.
 *
 * The natural choice for tests: asserting on what a service *did* rarely means
 * asserting on what it measured, and a sink that no-ops keeps measurement out
 * of the assertion.
 *
 * @typeParam TRuntime The runtime handle, ignored throughout.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export class NoopTelemetrySink<TRuntime = unknown> implements TelemetrySink<TRuntime> {
  /**
   * Discards the measurement.
   *
   * @returns `false`.
   */
  public request(): boolean {
    return false
  }

  /**
   * Discards the metric.
   *
   * @returns `false`.
   */
  public event(): boolean {
    return false
  }

  /**
   * Never available.
   *
   * @returns `false`.
   */
  public isAvailable(): boolean {
    return false
  }
}
