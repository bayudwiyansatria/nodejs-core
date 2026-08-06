import { ConfigurationRegistry } from '@/core/ConfigurationRegistry'
import { ConfigurationError } from '@/exceptions/ConfigurationError'

/**
 * @function
 *
 * Resolves a module's configuration.
 *
 * The one way the rest of the system reads configuration. Callers get a settled
 * object and never learn whether a value was defaulted or overridden.
 *
 * Merging is per field, not per module: an override naming only `model` keeps
 * the default `binding`, so a partial override cannot blank the rest. A field
 * set to `undefined` is ignored for the same reason — `{ model: undefined }`
 * means "no opinion", not "erase it".
 *
 * @remarks
 * The surface is registered by the application, through {@link configure}.
 * Keeping that edge in one place is what lets business logic stay unaware of
 * where settings come from.
 *
 * The type argument is explicit because this package cannot know the assembled
 * surface. The caller declares the shape it expects; the application is
 * responsible for having registered something that matches.
 *
 * @example
 * ```ts
 * const settings = resolve<CacheSettings>('cache')
 * // { ttl: 300 }
 * ```
 *
 * @typeParam S The settings shape the caller expects back.
 *
 * @param module Name of the module to resolve.
 * @returns The module's settings, with any override applied over the default.
 *
 * @throws {@link ConfigurationError} When the module is registered in neither
 * the defaults nor the overrides — almost always because `configure()` has not
 * run yet, or because a second copy of this package is loaded.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export const resolve = <S = unknown>(module: string): S => {
  const base = ConfigurationRegistry.defaults[module] as Record<string, unknown> | undefined
  const override = ConfigurationRegistry.overrides[module] as Record<string, unknown> | undefined

  /*
   * Throw rather than return undefined. Otherwise the fault surfaces at
   * whichever binding first dereferences the settings, where the message names
   * the cache instead of the missing configure() call behind it.
   */
  if (base === undefined && override === undefined) {
    throw new ConfigurationError(module)
  }

  if (!override) {
    return base as S
  }

  const resolved: Record<string, unknown> = { ...base }

  for (const [key, value] of Object.entries(override)) {
    if (value !== undefined) {
      resolved[key] = value
    }
  }

  return resolved as S
}
