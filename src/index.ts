/**
 * @module
 *
 * Public API of the kernel.
 *
 * @remarks
 * The entire published surface. `package.json#exports` points here and TypeDoc
 * documents from here, so a symbol is API when it appears below and internal
 * when it does not. Keep it a barrel — behaviour belongs in `core/`.
 *
 * ## Layers
 *
 * | Directory     | Holds                                                | May import from   |
 * | ------------- | ---------------------------------------------------- | ----------------- |
 * | `index.ts`    | re-exports only                                      | every layer       |
 * | `core/`       | behaviour: `Service`, `Logger`, the config engine    | every layer below |
 * | `types/`      | shapes callers receive or supply, incl. capabilities | nothing in `src/` |
 * | `constants/`  | values that never depend on runtime state            | nothing in `src/` |
 * | `exceptions/` | the faults raised                                    | nothing in `src/` |
 * | `security/`   | primitives that exist to be safe                     | nothing in `src/` |
 * | `utils/`      | helpers any library could use                        | nothing in `src/` |
 *
 * Dependency arrows point *into* the leaf layers and never back out. A lint rule
 * enforces it, because a convention only survives as long as everyone remembers
 * it, and the import that breaks it looks like every other import at the point
 * it is written.
 *
 * ## What belongs in this package
 *
 * The layer everything else depends on, which holds only while it names no
 * vendor, no runtime, and no HTTP framework. Anything here that seems to need a
 * vendor SDK, a runtime's types, or an HTTP framework belongs in an adapter
 * package instead — a second lint rule enforces that too.
 *
 * ## Quick start
 *
 * ```ts
 * import { configure, Logger, systemDefaults } from '@bayudwiyansatria/core'
 * import { platformDefaults } from '<the-adapter-package>'
 *
 * // Once, at startup, before anything resolves a setting.
 * configure({ ...systemDefaults, ...platformDefaults }, overrides)
 *
 * const log = Logger.fromEnv(env, { service: 'ArticleService' })
 * log.info('ready')
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */

/**
 * Core
 */
export { configure, Logger, resolve, Service } from '@/core'

/**
 * Core — implementations that satisfy a capability without providing it
 */
export { NoopCacheStore, NoopMessageQueue, NoopRateLimiter, NoopTelemetrySink } from '@/core'

/**
 * Constants
 */
export { systemDefaults } from '@/constants'

/**
 * Exceptions
 */
export { ConfigurationError, MissingCapabilityError } from '@/exceptions'

/**
 * Security
 */
export { redact, timingSafeEqual } from '@/security'

/**
 * Utilities
 */
export { Signature, Text, Time } from '@/utils'

/**
 * Types
 */
export type {
  APIResponse,
  Capability,
  CacheStore,
  CoordinationStore,
  DataStore,
  DeliverySettings,
  InferenceEngine,
  LogContext,
  LoggingSettings,
  LogLevel,
  MessageQueue,
  ObjectStore,
  Overrides,
  RateLimiter,
  RequestFacts,
  RequestMetadata,
  RequestMetric,
  SecuritySettings,
  SqlConnectionProvider,
  SqlCredentials,
  SqlStatement,
  SqlTarget,
  SqlWriteResult,
  StoredObject,
  SystemConfiguration,
  TelemetrySink,
  VectorIndex,
  VectorMatch
} from '@/types'
