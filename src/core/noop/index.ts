/**
 * @module
 *
 * Implementations that satisfy a capability without providing it.
 *
 * @remarks
 * Each one lets a deployment that never provisioned the backing resource keep
 * running, degrading exactly as its interface documents: a cache reads as a
 * permanent miss and drops writes, a queue reports that nothing was enqueued, a
 * rate limiter fails open. All of them answer `isAvailable` honestly, so a
 * caller that does care can branch on it.
 *
 * They are behaviour, so they live under `core/` rather than beside the
 * interfaces they implement in
 * [`types/capabilities/`](../../types/capabilities/index.ts).
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export { NoopCacheStore } from '@/core/noop/NoopCacheStore'
export { NoopMessageQueue } from '@/core/noop/NoopMessageQueue'
export { NoopRateLimiter } from '@/core/noop/NoopRateLimiter'
export { NoopTelemetrySink } from '@/core/noop/NoopTelemetrySink'
