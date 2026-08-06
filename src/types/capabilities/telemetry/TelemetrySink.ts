import { Capability } from '@/types/capabilities/Capability'
import type { RequestMetric } from '@/types/capabilities/telemetry/RequestMetric'

/**
 * @interface
 *
 * A sink for measurements — durations, counts, statuses — meant to be
 * aggregated rather than read back individually.
 *
 * @remarks
 * Deliberately distinct from logging. A telemetry backend samples at volume,
 * which is right for rates and percentiles and wrong for anything that must be
 * read back verbatim; a log line is the opposite. Keeping them as two
 * capabilities is what stops one being quietly used for the other's job.
 *
 * Every write is best-effort and returns a boolean instead of throwing:
 * telemetry must never be able to fail the request it is describing.
 *
 * @typeParam TRuntime The runtime handle the sink is resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface TelemetrySink<TRuntime = unknown> extends Capability<TRuntime> {
  /**
   * Records one request.
   *
   * @param runtime The runtime handle.
   * @param metric The request measurement.
   * @returns `true` when the data point was accepted.
   */
  request(runtime: TRuntime, metric: RequestMetric): boolean

  /**
   * Records a domain metric.
   *
   * @param runtime The runtime handle.
   * @param name The metric name — the key it is grouped by.
   * @param dimensions String dimensions to filter and group by.
   * @param measures Numeric measurements to aggregate.
   * @returns `true` when the data point was accepted.
   */
  event(runtime: TRuntime, name: string, dimensions?: string[], measures?: number[]): boolean
}
