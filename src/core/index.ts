/**
 * @module
 *
 * The domain layer: what this library does.
 *
 * @remarks
 * Five things live here, and they are the only things in the package that
 * *behave* — everything else is a shape, a constant, or a pure helper:
 *
 * - {@link Service} — the base a business service extends, and the `ok()` /
 *   `fail()` builders it gets from doing so.
 * - {@link Logger} — structured, level-classified lines to the runtime's log
 *   stream, and {@link LogFields}, which decides how much of one is ingested.
 * - {@link configure} and {@link resolve} — the configuration engine.
 * - {@link Retry} — a bounded retry that reads its budget from `delivery`.
 * - [`noop/`](./noop/index.ts) — implementations that satisfy a capability
 *   without providing it.
 *
 * ## The configuration engine
 *
 * ```
 * Business service
 *        │
 *        ▼
 * Adapters (bindings, services, middleware)
 *        │
 *        ▼
 * resolve()  ── reads the registry
 *        ▲
 *        │  seeded once at startup
 * configure(defaults, overrides)   ── called by the application
 *        ├── systemDefaults                        this package's half
 *        ├── an adapter's defaults                 the platform's half
 *        └── the application's own overrides
 * ```
 *
 * Everything downstream asks {@link resolve} for a module's settings and gets
 * one settled object back. Whether a value was defaulted or overridden is not
 * visible to the caller, and does not need to be.
 *
 * The kernel owns `logging` and `security`; anything a platform resource settles
 * belongs to an adapter package. The application joins the two halves when it
 * calls {@link configure}, so supporting another platform edits nothing here.
 *
 * @example
 * ```ts
 * import { configure, resolve, systemDefaults } from '@bayudwiyansatria/core'
 *
 * configure({ ...systemDefaults, ...platformDefaults }, overrides)
 *
 * const { level, service } = resolve<LoggingSettings>('logging')
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export { Service } from '@/core/Service'
export { Logger } from '@/core/Logger'
export { LogFields } from '@/core/LogFields'
export { configure } from '@/core/configure'
export { resolve } from '@/core/resolve'
export { Retry } from '@/core/Retry'

export type { RetryOptions } from '@/core/RetryOptions'

export { NoopCacheStore, NoopMessageQueue, NoopRateLimiter, NoopTelemetrySink } from '@/core/noop'
