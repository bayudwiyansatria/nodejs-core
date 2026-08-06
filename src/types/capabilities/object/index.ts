/**
 * @module
 *
 * Blob storage, and what a stored object reports about itself.
 *
 * @remarks
 * {@link ObjectStore} is the capability; {@link StoredObject} is the identity
 * and size it hands back after a write or in a listing. Grouped because the
 * shape means nothing apart from the store that produces it.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export type { ObjectStore } from '@/types/capabilities/object/ObjectStore'

export type { StoredObject } from '@/types/capabilities/object/StoredObject'
