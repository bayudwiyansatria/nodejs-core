import { APIResponse } from '@/types/APIResponse'

/**
 * @class
 *
 * Base class for every service — an adapter's and an application's alike.
 *
 * A service holds no per-request state: the runtime handle arrives as an
 * argument to each method, so one instance can be created at module scope and
 * reused. What this base contributes is the response contract — every method
 * returns an {@link APIResponse}, built through {@link Service.ok} or
 * {@link Service.fail} rather than assembled by hand, so a caller can map
 * `success` onto a status code without reading each service.
 *
 * @example
 * ```ts
 * export class ProfileService extends Service {
 *   public async get(env: Env, id: string): Promise<APIResponse> {
 *     const profile = await cache.get<Profile>(env, `profile:${id}`)
 *
 *     return profile ? this.ok('Profile found', profile) : this.fail(`Profile ${id} not found`)
 *   }
 * }
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export abstract class Service {
  /**
   * Builds a successful response.
   *
   * @param message Human-readable description of what happened.
   * @param data Payload returned to the caller.
   * @returns The response, with `success` set to `true`.
   */
  protected ok<T = unknown>(message: string, data: T = null): APIResponse {
    return {
      message,
      success: true,
      data
    }
  }

  /**
   * Builds a failed response.
   *
   * Reserved for outcomes the caller asked for and did not get — a missing
   * row, an absent object. Faults the caller cannot act on should throw
   * instead, so they surface as a `500` rather than a well-formed `false`.
   *
   * @param message Human-readable description of what went wrong.
   * @param data Payload returned to the caller.
   * @returns The response, with `success` set to `false`.
   */
  protected fail<T = unknown>(message: string, data: T = null): APIResponse {
    return {
      message,
      success: false,
      data
    }
  }
}
