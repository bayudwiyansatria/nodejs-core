import { Capability } from '@/types/capabilities/Capability'
import type { VectorMatch } from '@/types/capabilities/vector/VectorMatch'

/**
 * @interface
 *
 * Storage and nearest-neighbour search over embeddings.
 *
 * @remarks
 * Has no opinion about where a vector came from — pairing it with
 * {@link InferenceEngine} is the
 * caller's decision, and an embedding produced anywhere else indexes just as
 * well.
 *
 * Writes are applied asynchronously by most backends, so a mutation id comes
 * back rather than the applied state: a vector just written is not necessarily
 * a vector already searchable.
 *
 * @typeParam TRuntime The runtime handle the index is resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface VectorIndex<TRuntime = unknown> extends Capability<TRuntime> {
  /**
   * Stores a vector, replacing any vector already under that id.
   *
   * @param runtime The runtime handle.
   * @param id Id to store the vector under.
   * @param vector The embedding.
   * @param metadata Metadata to store alongside it.
   * @returns The mutation id.
   */
  index(runtime: TRuntime, id: string, vector: number[], metadata?: Record<string, unknown>): Promise<string>

  /**
   * Finds the vectors nearest to one supplied.
   *
   * @param runtime The runtime handle.
   * @param vector The query embedding.
   * @param topK How many matches to return. Falls back to the configured default.
   * @returns The matches, nearest first.
   */
  search(runtime: TRuntime, vector: number[], topK?: number): Promise<VectorMatch[]>

  /**
   * Finds the vectors nearest to one already indexed.
   *
   * @param runtime The runtime handle.
   * @param id Id of the vector to search from.
   * @returns The matches, nearest first.
   */
  similar(runtime: TRuntime, id: string): Promise<VectorMatch[]>

  /**
   * Deletes vectors by id.
   *
   * @param runtime The runtime handle.
   * @param ids Ids to delete.
   * @returns The mutation id.
   */
  remove(runtime: TRuntime, ids: string[]): Promise<string>
}
