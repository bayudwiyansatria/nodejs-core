/**
 * @module
 *
 * The shapes callers receive or supply.
 *
 * @remarks
 * Plain data throughout — no behaviour, no vendor handles, nothing that needs a
 * request to exist. Three groups:
 *
 * - [`capabilities/`](./capabilities/index.ts) — what the application needs from
 *   its platform, which an adapter package implements.
 * - [`logging/`](./logging/index.ts) — the severity scale, the settings that set
 *   a threshold against it, and the ambient fields a line carries.
 * - The rest, flat: {@link SecuritySettings} and the
 *   {@link SystemConfiguration} that joins it to the logging settings, the
 *   {@link Overrides} applied over either, and {@link APIResponse} — what a
 *   service hands back.
 *
 * A subject with more than one shape to its name gets a directory; a lone shape
 * stays flat. Same rule as [`capabilities/`](./capabilities/index.ts), so there
 * is one convention to learn rather than two.
 *
 * A leaf layer: nothing here imports from `core/`, which is what lets any of it
 * be read or reused without dragging the engine along. A lint rule enforces it.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export type { APIResponse } from '@/types/APIResponse'
export type { Overrides } from '@/types/Overrides'
export type { SecuritySettings } from '@/types/SecuritySettings'
export type { SystemConfiguration } from '@/types/SystemConfiguration'

export type { LogContext, LoggingSettings, LogLevel } from '@/types/logging'

export type {
  Capability,
  CacheStore,
  CoordinationStore,
  DataStore,
  InferenceEngine,
  MessageQueue,
  ObjectStore,
  RateLimiter,
  RequestFacts,
  RequestMetadata,
  RequestMetric,
  SqlConnectionProvider,
  SqlCredentials,
  SqlStatement,
  SqlTarget,
  SqlWriteResult,
  StoredObject,
  TelemetrySink,
  VectorIndex,
  VectorMatch
} from '@/types/capabilities'
