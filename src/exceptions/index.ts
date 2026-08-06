/**
 * @module
 *
 * The faults this package raises.
 *
 * @remarks
 * Both are deployment faults rather than request faults — something the code
 * depends on is absent or was never registered — so both are worth catching by
 * type rather than by message.
 *
 * {@link MissingCapabilityError} is the vendor-neutral base an adapter package
 * subclasses to say what "provisioned" means on its own platform. That
 * cross-package `instanceof` only holds while one copy of this package is
 * loaded, which is why an adapter must treat it as an external dependency.
 *
 * A leaf layer: nothing here imports from `core/`.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export { ConfigurationError } from '@/exceptions/ConfigurationError'
export { MissingCapabilityError } from '@/exceptions/MissingCapabilityError'
