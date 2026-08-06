/**
 * @typedef
 *
 * Overrides against a configuration surface.
 *
 * Every module is optional, and within a module every field is optional — an
 * override states only what it changes, and the rest falls back to the default.
 *
 * @typeParam C The configuration surface being overridden.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export type Overrides<C> = {
  [K in keyof C]?: Partial<C[K]>
}
