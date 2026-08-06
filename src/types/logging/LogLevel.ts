/**
 * @typedef
 *
 * Severity levels, ordered least to most severe.
 *
 * Declared here rather than in
 * [`Logger`](../../core/Logger.ts) so the configuration layer stays free
 * of runtime imports — the logger reads settings, not the other way round.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'
