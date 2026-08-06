import { Capability } from '@/types/capabilities/Capability'
import type { SqlStatement } from '@/types/capabilities/sql/SqlStatement'
import type { SqlWriteResult } from '@/types/capabilities/sql/SqlWriteResult'

/**
 * @interface
 *
 * Relational storage addressed with SQL.
 *
 * @remarks
 * Deliberately expressed in SQL and rows rather than entities. Nothing at this
 * level knows what an article or a user is; mapping rows onto a domain is the
 * business service's job, which is what keeps one storage capability usable by
 * every service in the application.
 *
 * Unlike a cache, storage is not optional infrastructure — an implementation
 * whose {@link Capability.isAvailable} is `false` throws rather than quietly
 * returning nothing, because a silent empty result set is indistinguishable
 * from real data and would corrupt whatever read it.
 *
 * @typeParam TRuntime The runtime handle the store is resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface DataStore<TRuntime = unknown> extends Capability<TRuntime> {
  /**
   * Runs a query and returns every row.
   *
   * @param runtime The runtime handle.
   * @param sql The query, using `?` placeholders.
   * @param values Values bound to the placeholders, in order.
   * @returns The rows.
   */
  all<T = Record<string, unknown>>(runtime: TRuntime, sql: string, ...values: unknown[]): Promise<T[]>

  /**
   * Runs a query and returns its first row.
   *
   * @param runtime The runtime handle.
   * @param sql The query, using `?` placeholders.
   * @param values Values bound to the placeholders, in order.
   * @returns The first row, or `null` when the query matched nothing.
   */
  first<T = Record<string, unknown>>(runtime: TRuntime, sql: string, ...values: unknown[]): Promise<T | null>

  /**
   * Runs a statement that changes data.
   *
   * @param runtime The runtime handle.
   * @param sql The statement, using `?` placeholders.
   * @param values Values bound to the placeholders, in order.
   * @returns What the write changed.
   */
  write(runtime: TRuntime, sql: string, ...values: unknown[]): Promise<SqlWriteResult>

  /**
   * Runs several statements together.
   *
   * @param runtime The runtime handle.
   * @param statements The statements, in order.
   * @returns One result per statement, in the same order.
   */
  batch(runtime: TRuntime, statements: SqlStatement[]): Promise<SqlWriteResult[]>
}
