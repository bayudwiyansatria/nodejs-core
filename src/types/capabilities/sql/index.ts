/**
 * @module
 *
 * Relational storage, and the shapes a statement travels in.
 *
 * @remarks
 * Two capabilities rather than one, because they answer different questions.
 * {@link DataStore} is storage the platform already provides, read and written
 * through the runtime handle. {@link SqlConnectionProvider} hands back the
 * credentials for a database the platform does *not* own — a different kind of
 * dependency, and a different failure when it is missing.
 *
 * The other four are the shapes those calls exchange: a statement going out, a
 * write result coming back, and the connection detail split in two so that
 * {@link SqlTarget} can be logged while {@link SqlCredentials} cannot.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export type { DataStore } from '@/types/capabilities/sql/DataStore'
export type { SqlConnectionProvider } from '@/types/capabilities/sql/SqlConnectionProvider'

export type { SqlCredentials } from '@/types/capabilities/sql/SqlCredentials'
export type { SqlStatement } from '@/types/capabilities/sql/SqlStatement'
export type { SqlTarget } from '@/types/capabilities/sql/SqlTarget'
export type { SqlWriteResult } from '@/types/capabilities/sql/SqlWriteResult'
