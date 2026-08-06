/**
 * @interface
 *
 * Outcome of a write.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface SqlWriteResult {
  /**
   * Number of rows the statement changed.
   */
  changes: number

  /**
   * Row id assigned by the last insert, or `0` when the statement inserted nothing.
   */
  lastRowId: number
}
