import { MessageQueue } from '@/types/capabilities/MessageQueue'

/**
 * @class
 *
 * A queue that accepts nothing.
 *
 * @remarks
 * Returns `false` from both enqueue methods, which
 * [`MessageQueue`](../../types/capabilities/MessageQueue.ts) defines as "the follow-up work was not
 * scheduled" rather than as a failure — so a caller keeps succeeding at the
 * thing it was actually asked to do and decides for itself whether the missed
 * follow-up is worth a log line.
 *
 * Worth being deliberate about: swapping this in silently drops background
 * work. That is correct when the work is genuinely optional, and wrong when a
 * queued message is the only record that something must happen later.
 *
 * @typeParam T The message body, never read.
 * @typeParam TRuntime The runtime handle, ignored throughout.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export class NoopMessageQueue<T = unknown, TRuntime = unknown> implements MessageQueue<T, TRuntime> {
  /**
   * Discards the message.
   *
   * @returns `false`.
   */
  public async enqueue(): Promise<boolean> {
    return false
  }

  /**
   * Discards the batch.
   *
   * @returns `false`.
   */
  public async enqueueAll(): Promise<boolean> {
    return false
  }

  /**
   * Never available.
   *
   * @returns `false`.
   */
  public isAvailable(): boolean {
    return false
  }
}
