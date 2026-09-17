import { configure, Retry, systemDefaults } from '../../src/index'

import type { Logger } from '../../src/index'

/**
 * A failure shaped like an HTTP client's, without depending on one.
 *
 * @param status The response status it carries.
 * @returns An `Error` with a numeric `status`, which is all the default judgement reads.
 */
const httpFailure = (status: number): Error => Object.assign(new Error(`status ${status}`), { status })

/**
 * Retry is the only thing between a flaky dependency and a job that never ends,
 * so what matters is the bound: the attempt count is respected exactly, and the
 * failures that must never be retried never are.
 *
 * Backoff is overridden to zero wherever the delay is not the subject — these
 * specs are about decisions, and a real 250 ms backoff adds time, not confidence.
 */
describe('Retry.run', () => {
  beforeEach(() => {
    configure({ ...systemDefaults })
  })

  it('returns the first success without retrying', async () => {
    const operation = jest.fn().mockResolvedValue('done')

    await expect(Retry.run(operation, { backoffMs: 0 })).resolves.toBe('done')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('retries a transient failure and returns the eventual success', async () => {
    const operation = jest.fn().mockRejectedValueOnce(httpFailure(503)).mockResolvedValue('done')

    await expect(Retry.run(operation, { backoffMs: 0 })).resolves.toBe('done')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('stops at the requested attempt count and rethrows the last failure unchanged', async () => {
    const failure = httpFailure(503)
    const operation = jest.fn().mockRejectedValue(failure)

    await expect(Retry.run(operation, { attempts: 3, backoffMs: 0 })).rejects.toBe(failure)
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('defaults the attempt count to delivery.retries plus the first attempt', async () => {
    configure({ ...systemDefaults }, { delivery: { retries: 1, retryBackoffMs: 0 } })
    const operation = jest.fn().mockRejectedValue(httpFailure(503))

    await expect(Retry.run(operation)).rejects.toThrow('status 503')
    expect(operation).toHaveBeenCalledTimes(2)
  })

  it('fails immediately on a non-retryable failure, without spending the budget', async () => {
    const operation = jest.fn().mockRejectedValue(httpFailure(404))

    await expect(Retry.run(operation, { attempts: 3, backoffMs: 0 })).rejects.toThrow('status 404')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('honours the caller judgement over the default', async () => {
    const operation = jest.fn().mockRejectedValue(httpFailure(503))

    await expect(Retry.run(operation, { attempts: 3, backoffMs: 0, isRetryable: () => false })).rejects.toThrow()
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it.each([0, -2, Number.NaN])('runs once when asked for %p attempts', async attempts => {
    const operation = jest.fn().mockResolvedValue('done')

    await expect(Retry.run(operation, { attempts, backoffMs: 0 })).resolves.toBe('done')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('does not need configure() when both defaults are overridden', async () => {
    configure({})
    const operation = jest.fn().mockResolvedValue('done')

    await expect(Retry.run(operation, { attempts: 2, backoffMs: 0 })).resolves.toBe('done')
  })

  it('doubles the backoff and logs each re-attempt under the named event', async () => {
    jest.useFakeTimers()
    try {
      const warn = jest.fn()
      const logger = { warn } as unknown as Logger
      const operation = jest.fn().mockRejectedValue(httpFailure(503))

      const outcome = Retry.run(operation, { attempts: 3, backoffMs: 100, logger, event: 'rates.retry' })
      const settled = expect(outcome).rejects.toThrow('status 503')

      await jest.advanceTimersByTimeAsync(100)
      await jest.advanceTimersByTimeAsync(200)
      await settled

      expect(operation).toHaveBeenCalledTimes(3)
      expect(warn.mock.calls.map(([event, data]) => [event, data.attempt, data.delayMs])).toEqual([
        ['rates.retry', 1, 100],
        ['rates.retry', 2, 200]
      ])
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('Retry.isRetryable', () => {
  it.each([429, 500, 502, 503, 504])('retries a %i, which is the far end asking for a moment', status => {
    expect(Retry.isRetryable(httpFailure(status))).toBe(true)
  })

  it.each([400, 401, 403, 404, 422])('does not retry a %i, which repeats the same question', status => {
    expect(Retry.isRetryable(httpFailure(status))).toBe(false)
  })

  it.each(['AbortError', 'TimeoutError'])('does not retry an %s, whose budget is already spent', name => {
    const aborted = new Error('The operation was aborted')

    aborted.name = name

    expect(Retry.isRetryable(aborted)).toBe(false)
  })

  it('retries a bare network failure, since DNS and connection resets are worth a second look', () => {
    expect(Retry.isRetryable(new TypeError('fetch failed'))).toBe(true)
  })

  it('retries a thrown value that is not an Error, which carries nothing to judge', () => {
    expect(Retry.isRetryable('socket hang up')).toBe(true)
  })

  it('ignores a status that is not a number', () => {
    expect(Retry.isRetryable(Object.assign(new Error('odd'), { status: '404' }))).toBe(true)
  })
})
