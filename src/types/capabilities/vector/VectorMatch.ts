/**
 * @interface
 *
 * One result of a similarity search.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface VectorMatch {
  /**
   * Id of the matched vector.
   */
  id: string

  /**
   * Similarity score.
   */
  score: number

  /**
   * Metadata stored with the vector, when it was requested.
   */
  metadata?: Record<string, unknown>
}
