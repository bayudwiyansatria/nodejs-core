/**
 * @module
 *
 * Measurements meant to be aggregated, and the shape one arrives in.
 *
 * @remarks
 * {@link TelemetrySink} accepts {@link RequestMetric}, and both are kept
 * deliberately apart from logging: a telemetry backend samples at volume, which
 * is right for rates and percentiles and wrong for anything that must be read
 * back verbatim.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export type { TelemetrySink } from '@/types/capabilities/telemetry/TelemetrySink'

export type { RequestMetric } from '@/types/capabilities/telemetry/RequestMetric'
