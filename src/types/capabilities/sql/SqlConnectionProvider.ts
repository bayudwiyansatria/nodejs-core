import { Capability } from '@/types/capabilities/Capability'
import type { SqlCredentials } from '@/types/capabilities/sql/SqlCredentials'
import type { SqlTarget } from '@/types/capabilities/sql/SqlTarget'

/**
 * @interface
 *
 * Supplies connection details for an external SQL database.
 *
 * @remarks
 * Deliberately not a query interface — it hands over credentials and stops
 * there, leaving the driver to the caller. That separation is what makes the
 * capability usable with whichever client the database needs, rather than
 * committing the whole application to one.
 *
 * Treat everything returned as short-lived: an implementation that pools
 * connections may mint credentials per instance, so caching them beyond the
 * current one is a bug that only appears under load.
 *
 * @typeParam TRuntime The runtime handle the provider is resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface SqlConnectionProvider<TRuntime = unknown> extends Capability<TRuntime> {
  /**
   * The connection string.
   *
   * @param runtime The runtime handle.
   * @returns The connection string.
   */
  connectionString(runtime: TRuntime): string

  /**
   * The connection details, broken out.
   *
   * @param runtime The runtime handle.
   * @returns The credentials.
   */
  credentials(runtime: TRuntime): SqlCredentials

  /**
   * Host and database name only — enough to log or display what is being
   * connected to without putting a password anywhere near a log line.
   *
   * @param runtime The runtime handle.
   * @returns The target, or `null` when the provider is unavailable.
   */
  target(runtime: TRuntime): SqlTarget | null
}
