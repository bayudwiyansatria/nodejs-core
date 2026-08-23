/**
 * @module
 *
 * Primitives whose whole purpose is to be safe.
 *
 * @remarks
 * Its own layer rather than a corner of `utils/`, because the distinction is
 * intent: {@link timingSafeEqual} exists only to make a comparison safe against
 * a timing attack, which is a security decision and nothing else. A helper that
 * happens to be useful is a util; a helper that exists because the obvious
 * alternative is unsafe belongs here.
 *
 * {@link redact} is here for the same reason: it exists because the obvious
 * alternative — handing a payload straight to the logger — leaks credentials
 * into a log stream, and no amount of care at the call site makes that
 * recoverable once it has shipped.
 *
 * A leaf layer: nothing here imports from `core/`.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export { redact } from '@/security/redact'
export { timingSafeEqual } from '@/security/timingSafeEqual'
