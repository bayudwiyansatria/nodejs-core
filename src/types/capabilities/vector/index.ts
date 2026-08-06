/**
 * @module
 *
 * Embedding storage, and nearest-neighbour search over it.
 *
 * @remarks
 * {@link VectorIndex} is the capability; {@link VectorMatch} is one result of a
 * search. The index has no opinion about where a vector came from, so an
 * embedding produced by an inference engine and one produced anywhere else
 * index the same way.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export type { VectorIndex } from '@/types/capabilities/vector/VectorIndex'

export type { VectorMatch } from '@/types/capabilities/vector/VectorMatch'
