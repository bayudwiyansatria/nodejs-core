import { NoopCacheStore, NoopMessageQueue, NoopRateLimiter, NoopTelemetrySink } from '../../src/index'

/**
 * Implementations that satisfy a capability without providing it.
 *
 * Their whole purpose is to let a deployment that never provisioned the backing
 * resource keep running, so what is pinned here is the degradation each
 * interface documents — every one of these must degrade rather than throw, and
 * must answer `isAvailable` honestly so a caller that *does* care can branch.
 */
describe('NoopCacheStore', () => {
  const cache = new NoopCacheStore()

  it('reports itself unavailable', () => {
    expect(cache.isAvailable()).toBe(false)
  })

  it('reads as a permanent miss', async () => {
    await expect(cache.get()).resolves.toBeNull()
  })

  it('drops writes without throwing', async () => {
    await expect(cache.set()).resolves.toBeUndefined()
    await expect(cache.remove()).resolves.toBeUndefined()
  })

  it('has no keys', async () => {
    await expect(cache.keys()).resolves.toEqual([])
  })

  /*
   * The load-bearing one. `remember` is the read-through helper callers use
   * instead of get-then-set, so with no cache it must still return the loaded
   * value — otherwise an unprovisioned cache turns every read into a null.
   */
  it('still returns the loaded value from remember', async () => {
    await expect(cache.remember(null, 'key', async () => 'loaded')).resolves.toBe('loaded')
  })

  it('calls the loader on every remember, since nothing is retained', async () => {
    const load = jest.fn(async () => 'loaded')

    await cache.remember(null, 'key', load)
    await cache.remember(null, 'key', load)

    expect(load).toHaveBeenCalledTimes(2)
  })
})

describe('NoopRateLimiter', () => {
  it('reports itself unavailable', () => {
    expect(new NoopRateLimiter().isAvailable()).toBe(false)
  })

  /*
   * Fails open by default: an unconfigured limiter should degrade to no limit
   * rather than to no service.
   */
  it('admits every request by default', async () => {
    await expect(new NoopRateLimiter().admit()).resolves.toBe(true)
  })

  it('can be constructed closed, to refuse instead', async () => {
    await expect(new NoopRateLimiter(false).admit()).resolves.toBe(false)
  })
})

describe('NoopMessageQueue', () => {
  const queue = new NoopMessageQueue()

  it('reports itself unavailable', () => {
    expect(queue.isAvailable()).toBe(false)
  })

  /*
   * Reports `false` rather than throwing or lying: the message really was not
   * enqueued, and a caller that must know can act on the answer.
   */
  it('reports that nothing was enqueued', async () => {
    await expect(queue.enqueue()).resolves.toBe(false)
    await expect(queue.enqueueAll()).resolves.toBe(false)
  })
})

describe('NoopTelemetrySink', () => {
  const sink = new NoopTelemetrySink()

  it('reports itself unavailable', () => {
    expect(sink.isAvailable()).toBe(false)
  })

  it('reports that nothing was recorded', () => {
    expect(sink.request()).toBe(false)
    expect(sink.event()).toBe(false)
  })
})
