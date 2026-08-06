/**
 * @class
 *
 * Error thrown when a module's settings were never registered.
 *
 * @remarks
 * Two ways to get here, and they look identical at the call site, so the
 * message names both:
 *
 * - **`configure()` has not run.** It goes once at startup, before anything
 *   that resolves settings is constructed. Usually a binding built at module
 *   scope instead of inside a handler.
 * - **Two copies of this package are loaded.** The registry is module state, so
 *   `configure()` seeds one copy while `resolve()` reads the other and every
 *   lookup misses. Happens when a bundler inlines the kernel into an adapter
 *   package rather than leaving it external.
 *
 * The second is worth spelling out because nothing in the stack trace suggests
 * a packaging problem.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export class ConfigurationError extends Error {
  /**
   * Name of the module whose settings could not be resolved.
   */
  public readonly module: string

  /**
   * Constructs a ConfigurationError.
   *
   * @param module Name of the module whose settings could not be resolved.
   * @param message Full message. Defaults to one naming both likely causes.
   */
  constructor(module: string, message?: string) {
    super(
      message ||
        `No configuration registered for module '${module}'. Call configure() once at startup, ` +
          'before constructing anything that resolves settings. If it was called, two copies of ' +
          '@bayudwiyansatria/core are loaded — mark it external in your bundler so the registry is shared.'
    )
    this.name = 'ConfigurationError'
    this.module = module
  }
}
