import { ConfigurationRegistry } from '@/core/ConfigurationRegistry'

import type { Overrides } from '@/types/Overrides'

/**
 * @function
 *
 * Registers the configuration surface this process runs on.
 *
 * Call once at startup, before anything resolves a setting. Everything
 * downstream reads it back through {@link resolve}.
 *
 * @remarks
 * The application assembles the surface, because it is the only layer that
 * knows every half of it: this package supplies the runtime-neutral defaults, an
 * adapter package supplies the platform-backed ones, and the application
 * supplies the overrides. Nothing here cares which half a key came from, so
 * supporting another platform means editing the application rather than this
 * file.
 *
 * A second call replaces the surface rather than merging into it. That keeps a
 * single call unambiguous, and gives a test a clean way to install a fixture.
 *
 * @example
 * ```ts
 * import { configure, systemDefaults } from '@bayudwiyansatria/core'
 * import { platformDefaults } from '<the-adapter-package>'
 * import { overrides } from 'config'
 *
 * configure({ ...systemDefaults, ...platformDefaults }, overrides)
 * ```
 *
 * @typeParam C The assembled configuration surface.
 *
 * @param defaults Every module's settings before any override applies.
 * @param overrides Partial per-module overrides. Omit for defaults alone.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export const configure = <C extends object>(defaults: C, overrides: Overrides<C> = {}): void => {
  ConfigurationRegistry.defaults = defaults as Record<string, unknown>
  ConfigurationRegistry.overrides = overrides as Record<string, unknown>
}
