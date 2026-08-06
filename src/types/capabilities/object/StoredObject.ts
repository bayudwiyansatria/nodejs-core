/**
 * @interface
 *
 * An object's identity and size, as reported after a write or a listing.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface StoredObject {
  /**
   * The object key.
   */
  key: string

  /**
   * Size in bytes.
   */
  size: number
}
