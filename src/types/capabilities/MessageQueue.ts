import { Capability } from '@/types/capabilities/Capability'

/**
 * @interface
 *
 * A producer that hands work to something else to finish later.
 *
 * @remarks
 * Producing only. Consuming is an entrypoint concern — the runtime delivers a
 * batch to a handler rather than the application asking for one — so it is not
 * expressible as a method here and does not belong on this interface.
 *
 * Enqueueing returns a boolean rather than throwing because the work is by
 * definition not what the caller is waiting on: the request that triggered it
 * should still succeed when the follow-up could not be scheduled, and the
 * caller decides whether that is worth logging. An unavailable queue reports
 * `false` for the same reason.
 *
 * @typeParam T The message body.
 * @typeParam TRuntime The runtime handle the queue is resolved from.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export interface MessageQueue<T = unknown, TRuntime = unknown> extends Capability<TRuntime> {
  /**
   * Enqueues one message.
   *
   * @param runtime The runtime handle.
   * @param message The message body.
   * @param delaySeconds Delay before the message becomes visible to consumers.
   * @returns `true` when the message was accepted.
   */
  enqueue(runtime: TRuntime, message: T, delaySeconds?: number): Promise<boolean>

  /**
   * Enqueues several messages together.
   *
   * @param runtime The runtime handle.
   * @param messages The message bodies.
   * @returns `true` when the batch was accepted.
   */
  enqueueAll(runtime: TRuntime, messages: T[]): Promise<boolean>
}
