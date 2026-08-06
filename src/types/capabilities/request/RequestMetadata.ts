import type { RequestFacts } from '@/types/capabilities/request/RequestFacts'

/**
 * @interface
 *
 * Reads the runtime's own account of a request.
 *
 * @remarks
 * Exists because the interesting facts about a request are not in the request.
 * The client's real address, the trace id, the location that served it — each
 * arrives in a header or property the platform sets, under a name only that
 * platform uses. Reading them inline is what pins otherwise portable security
 * and logging middleware to one vendor.
 *
 * Trust is the reason this is one interface rather than a handful of header
 * lookups at call sites. Which header may be believed is a platform fact, and
 * getting it wrong is a security bug rather than a portability one: a proxy
 * header the edge overwrites can be trusted, while one any caller can set
 * cannot, and only that platform's own adapter knows which is which.
 * Concentrating the judgement in one implementation per platform means a caller
 * cannot get it wrong by reaching for the convenient header.
 *
 * @typeParam TRequest The runtime's request type.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface RequestMetadata<TRequest = unknown> {
  /**
   * Reads what the runtime knows about a request.
   *
   * @param request The incoming request.
   * @returns The facts, with every field either populated or explicitly absent.
   */
  read(request: TRequest): RequestFacts
}
