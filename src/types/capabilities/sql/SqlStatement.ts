/**
 * @interface
 *
 * One statement in a batch, with its bind values.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface SqlStatement {
  /**
   * SQL statement, using `?` placeholders for bind values.
   */
  sql: string

  /**
   * Values bound to the placeholders, in order.
   */
  values?: unknown[]
}
