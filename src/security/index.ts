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
 * A leaf layer: nothing here imports from `core/`.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export { timingSafeEqual } from '@/security/timingSafeEqual'
