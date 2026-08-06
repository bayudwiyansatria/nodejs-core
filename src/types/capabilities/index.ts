/**
 * @module
 *
 * What the application needs from its platform, stated without naming one.
 *
 * @remarks
 * Each interface here describes a capability — a cache, relational storage, a
 * queue — in terms of what a caller does with it. The implementations live in
 * adapter packages, the only side that knows about connection strings, bindings,
 * SDK clients, or any vendor's types.
 *
 * Two rules make the split worth having:
 *
 * - **Narrow on purpose.** An interface carries only what a caller of *that*
 *   capability needs. Backend-specific extras stay on the implementation: a
 *   queue adapter that can report backlog depth, or an inference adapter that
 *   returns a gateway request id, keeps those off the interface. Widening one to
 *   cover a single caller is how these stop being substitutable.
 * - **Degradation is part of the contract.** Whether a capability degrades or
 *   throws when it is not provisioned is written into each interface, not left
 *   to the implementation, because a caller choosing between two of them is
 *   relying on the answer meaning the same thing in both.
 *
 * They sit under [`types/`](../index.ts) because that is what they are: shapes a
 * caller depends on and an adapter supplies. The no-op implementations that
 * satisfy them without providing anything are behaviour, so they live in
 * [`core/noop/`](../../core/noop/index.ts) instead.
 *
 * ## Layout
 *
 * A capability that owns supporting shapes gets a directory, and the shapes go
 * in it — [`sql/`](./sql/index.ts), [`vector/`](./vector/index.ts),
 * [`object/`](./object/index.ts), [`request/`](./request/index.ts), and
 * [`telemetry/`](./telemetry/index.ts). The rest are a single interface each and
 * stay flat beside {@link Capability}, which all of them extend.
 *
 * The split is by what a shape belongs to rather than by what it is named:
 * `RequestMetric` sits under `telemetry/` because {@link TelemetrySink} is the
 * only thing that accepts one, not under `request/` with the two types that
 * share its prefix. That keeps each directory readable on its own — the
 * capability, and nothing but what its calls exchange.
 *
 * @example
 * ```ts
 * import { CacheStore } from '@bayudwiyansatria/core'
 *
 * // Depend on the capability, not on the adapter that happens to provide it.
 * const cached = async <E>(cache: CacheStore<E>, env: E) => await cache.get(env, 'key')
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export type { Capability } from '@/types/capabilities/Capability'

export type { CacheStore } from '@/types/capabilities/CacheStore'
export type { CoordinationStore } from '@/types/capabilities/CoordinationStore'
export type { InferenceEngine } from '@/types/capabilities/InferenceEngine'
export type { MessageQueue } from '@/types/capabilities/MessageQueue'
export type { RateLimiter } from '@/types/capabilities/RateLimiter'

export type { ObjectStore, StoredObject } from '@/types/capabilities/object'
export type { RequestFacts, RequestMetadata } from '@/types/capabilities/request'
export type {
  DataStore,
  SqlConnectionProvider,
  SqlCredentials,
  SqlStatement,
  SqlTarget,
  SqlWriteResult
} from '@/types/capabilities/sql'
export type { RequestMetric, TelemetrySink } from '@/types/capabilities/telemetry'
export type { VectorIndex, VectorMatch } from '@/types/capabilities/vector'
