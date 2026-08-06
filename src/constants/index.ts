/**
 * @module
 *
 * Values fixed for every caller.
 *
 * @remarks
 * Nothing here depends on runtime state — no environment, no request, no
 * configuration lookup. {@link systemDefaults} is what an application runs on
 * before it overrides anything, which makes it a constant rather than part of
 * the engine that reads it.
 *
 * A leaf layer: nothing here imports from `core/`.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export { systemDefaults } from '@/constants/Defaults'
