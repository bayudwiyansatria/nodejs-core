/**
 * @interface
 *
 * Everything needed to open a connection to an external SQL database.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface SqlCredentials {
  /**
   * Hostname to connect to.
   */
  host: string

  /**
   * Port paired with {@link SqlCredentials.host}.
   */
  port: number

  /**
   * Database user.
   */
  user: string

  /**
   * Password.
   */
  password: string

  /**
   * Name of the database to connect to.
   */
  database: string
}
