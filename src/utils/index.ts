/**
 * @module
 *
 * Framework utilities — pure helpers this package itself depends on.
 *
 * @remarks
 * These are published because the kernel needs them, not because they aim to be
 * a general-purpose utility belt. `Text` shortens a telemetry sampling key,
 * `Time` stamps every log line and measures every request, and `Signature` signs
 * a value that has to travel somewhere the process does not control. Application
 * code may use them too, through the package barrel.
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
 * import { Signature, Text, Time } from '@bayudwiyansatria/core'
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export { Signature } from '@/utils/Signature'
export { Text } from '@/utils/Text'
export { Time } from '@/utils/Time'
