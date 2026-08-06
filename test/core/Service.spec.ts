import { Service } from '../../src/index'

import type { APIResponse } from '../../src/index'

/**
 * The response contract business services are written against.
 *
 * `ok` and `fail` are `protected` on purpose — the envelope is built by the
 * service, never assembled at a call site — so the only way to exercise them is
 * through a subclass, which is also how every real consumer uses them.
 */
class ExampleService extends Service {
  public succeed<T>(message: string, data?: T): APIResponse {
    return data === undefined ? this.ok(message) : this.ok(message, data)
  }

  public refuse<T>(message: string, data?: T): APIResponse {
    return data === undefined ? this.fail(message) : this.fail(message, data)
  }
}

describe('Service', () => {
  const service = new ExampleService()

  it('marks an ok envelope successful', () => {
    expect(service.succeed('created', { id: 1 })).toEqual({
      message: 'created',
      success: true,
      data: { id: 1 }
    })
  })

  it('marks a fail envelope unsuccessful', () => {
    expect(service.refuse('not found')).toEqual({
      message: 'not found',
      success: false,
      data: null
    })
  })

  /*
   * `data` defaults to null rather than being omitted, so the key is always
   * present. A consumer reading `response.data` never has to distinguish
   * "absent" from "explicitly nothing".
   */
  it('always carries a data key, defaulting to null', () => {
    const response = service.succeed('done')

    expect(response.data).toBeNull()
    expect(Object.keys(response).sort()).toEqual(['data', 'message', 'success'])
  })

  it('carries a payload on failure too', () => {
    expect(service.refuse('invalid', { field: 'title' })).toEqual({
      message: 'invalid',
      success: false,
      data: { field: 'title' }
    })
  })

  it('preserves falsy payloads rather than replacing them with null', () => {
    expect(service.succeed('counted', 0).data).toBe(0)
    expect(service.succeed('listed', []).data).toEqual([])
    expect(service.succeed('flagged', false).data).toBe(false)
  })
})
