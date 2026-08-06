/**
 * @interface
 *
 * The part of a database connection that is safe to show.
 *
 * @remarks
 * Deliberately a subset of
 * [`SqlCredentials`](./SqlCredentials.ts) with the password and user left out,
 * so a log line or a health endpoint can say *which* database is being reached
 * without carrying anything that would matter if it leaked. Anything needing
 * the full set asks for the credentials explicitly, which makes the risky call
 * the visible one.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface SqlTarget {
  /**
   * Hostname being connected to.
   */
  host: string

  /**
   * Name of the database being connected to.
   */
  database: string
}
