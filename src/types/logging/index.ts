/**
 * @module
 *
 * What a log line carries, and what decides whether it is emitted at all.
 *
 * @remarks
 * Three shapes for one subject: {@link LogLevel} is the severity scale,
 * {@link LoggingSettings} is the threshold a deployment settles, and
 * {@link LogContext} is the ambient fields attached to every line.
 *
 * All three are plain data, declared here rather than beside
 * [`Logger`](../../core/Logger.ts) so the configuration layer can read the
 * settings without importing the logger — the dependency runs one way, and only
 * one way.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export type { LogContext } from '@/types/logging/LogContext'
export type { LoggingSettings } from '@/types/LoggingSettings'
export type { LogLevel } from '@/types/logging/LogLevel'
