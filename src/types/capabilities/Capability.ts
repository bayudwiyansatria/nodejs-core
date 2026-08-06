/**
 * @interface
 *
 * The one member every capability shares.
 *
 * @remarks
 * `TRuntime` is what keeps this layer free of any vendor type. A capability is
 * always reached through some runtime handle — an environment object carrying
 * the resources, a connection pool, a client — and the handle arrives as an
 * argument rather than being captured at construction, because on some runtimes
 * it does not exist until a request does. Rather than name that handle here,
 * every capability takes it as a type parameter and the implementation binds
 * it: `CacheService implements CacheStore<Env>`.
 *
 * The practical effect is that this package describes what an application needs
 * without importing any vendor's types, while call sites keep passing their own
 * handle exactly as they always did.
 *
 * @typeParam TRuntime The runtime handle capabilities are resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface Capability<TRuntime = unknown> {
  /**
   * Reports whether the capability is actually usable on this runtime.
   *
   * @remarks
   * A capability backed by an optional resource answers `false` when that
   * resource was never provisioned. Implementations must document what each
   * method does in that state — degrade or throw — and must not vary it, since
   * a caller choosing between two implementations is relying on the answer
   * meaning the same thing in both.
   *
   * @param runtime The runtime handle.
   * @returns `true` when calls will reach a real backing resource.
   */
  isAvailable(runtime: TRuntime): boolean
}
