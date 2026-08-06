/**
 * @constant
 *
 * The configuration surface, held for the lifetime of the module.
 *
 * @remarks
 * Internal and mutable. {@link configure} writes it, {@link resolve} reads it,
 * and nothing else touches it — it is not re-exported from the package barrel.
 *
 * Module state, so there is one per loaded copy of this package. A bundler that
 * inlines a second copy therefore breaks configuration; see the diagnostic in
 * {@link resolve}.
 *
 * @internal
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export const ConfigurationRegistry: {
  /**
   * Every module's settings before any override applies.
   */
  defaults: Record<string, unknown>

  /**
   * Per-module partial overrides, applied field by field over the defaults.
   */
  overrides: Record<string, unknown>
} = {
  defaults: {},
  overrides: {}
}
