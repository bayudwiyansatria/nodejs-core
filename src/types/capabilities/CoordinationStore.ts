import { Capability } from '@/types/capabilities/Capability'

/**
 * @interface
 *
 * Strongly consistent, single-threaded state addressed by name.
 *
 * @remarks
 * The capability for the things a cache cannot do: a counter that must not lose
 * an increment, a lock, a session two requests may touch at once. Every call for
 * a given name reaches the same instance, and that instance handles one request
 * at a time — which is what makes read-modify-write safe here and unsafe in
 * {@link CacheStore}.
 *
 * Addressing is by name rather than by handle so that callers need no discovery
 * step: two callers that agree on a name are talking to the same state.
 *
 * @typeParam TRuntime The runtime handle the store is resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface CoordinationStore<TRuntime = unknown> extends Capability<TRuntime> {
  /**
   * Calls the instance registered under a name.
   *
   * @param runtime The runtime handle.
   * @param name Name identifying the instance.
   * @param path Path within the instance's own handler.
   * @param init Request options — method, headers, body.
   * @returns The parsed response.
   */
  call<T = unknown>(runtime: TRuntime, name: string, path: string, init?: RequestInit): Promise<T>

  /**
   * Creates a fresh instance and returns its id.
   *
   * @param runtime The runtime handle.
   * @returns The new instance's id.
   */
  create(runtime: TRuntime): string
}
