/**
 * @class
 *
 * Error thrown when a capability is required but was never provisioned.
 *
 * @remarks
 * The vendor-neutral base for the failure every capability shares: something the
 * code depends on is absent from the environment it runs in. A deployment fault,
 * not a request fault.
 *
 * An adapter subclasses this to say what "provisioned" means on its platform,
 * naming the missing binding, connection string, or environment variable. An
 * operator gets a diagnosable message; a caller can still catch the general case
 * with one `instanceof`.
 *
 * That cross-package `instanceof` holds only while one copy of this package is
 * loaded. An adapter that inlines the kernel gets a second, unrelated class of
 * the same name, and the check silently returns `false`.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export class MissingCapabilityError extends Error {
  /**
   * Name of the capability that could not be resolved.
   */
  public readonly capability: string

  /**
   * Constructs a MissingCapabilityError.
   *
   * @param capability Name of the capability that could not be resolved.
   * @param message Full message. Defaults to a generic one naming the capability.
   */
  constructor(capability: string, message?: string) {
    super(message || `Missing capability '${capability}'. It is not provisioned in this environment.`)
    this.name = 'MissingCapabilityError'
    this.capability = capability
  }
}
