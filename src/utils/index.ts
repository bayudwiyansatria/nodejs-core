/**
 * @module
 *
 * Framework utilities — pure helpers this package itself depends on.
 *
 * @remarks
 * These are narrow on purpose: this is not a general-purpose utility belt. `Text`
 * shortens a telemetry sampling key and `Time` stamps every log line, both for the
 * kernel itself; `Signature` signs a value that has to travel somewhere the process
 * does not control, `List` partitions a batch against a ceiling the caller knows,
 * and `Json` reads a body the caller did not write. The last three the kernel does
 * not call — they are here because a helper that is pure, vendor-neutral and
 * already written twice in two consumers is a helper those consumers should share
 * rather than keep diverging copies of.
 *
 * An application's *own* helpers — the ones encoding decisions about its input
 * and its domain — belong in that application, not here. The one-way rule is the
 * point: this package never imports from a consumer.
 *
 * Everything here is a pure function over its arguments: no environment, no
 * binding, no configuration. A helper that needs any of those is a capability,
 * and belongs behind an interface in
 * [`types/capabilities/`](../types/capabilities/index.ts) with an adapter to
 * implement it.
 *
 * A helper that exists *because the obvious alternative is unsafe* belongs in
 * [`security/`](../security/index.ts) instead. `Signature` stays here because it
 * is a pure function like the other two; `timingSafeEqual` is over there because
 * making a comparison safe is its only reason to exist.
 *
 * @example
 * ```ts
 * import { Json, List, Signature, Text, Time } from '@bayudwiyansatria/core'
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export { Json } from '@/utils/Json'
export { List } from '@/utils/List'
export { Signature } from '@/utils/Signature'
export { Text } from '@/utils/Text'
export { Time } from '@/utils/Time'
