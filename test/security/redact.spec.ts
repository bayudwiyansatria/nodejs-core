import { redact } from '../../src/index'

/**
 * The last line of defence between a payload and a log stream.
 *
 * The cases below are grouped by the question each answers: what counts as a
 * secret, how far the walk goes, and what must survive untouched — that last
 * group being the one that keeps redaction from quietly destroying the fields
 * an operator came for.
 */
describe('redact', () => {
  it('masks a field whose name is a credential', () => {
    expect(redact({ password: 'hunter2' })).toEqual({ password: '[redacted]' })
  })

  /*
   * Matching is by substring, so one entry covers every spelling a codebase
   * accumulates. All four of these are the same secret with a different name.
   */
  it.each(['apiKey', 'API_KEY', 'x-api-key', 'providerApiKey'])('masks %s however it is spelled', key => {
    expect(redact({ [key]: 'live-key' })).toEqual({ [key]: '[redacted]' })
  })

  it.each([
    'authorization',
    'Cookie',
    'set-cookie',
    'accessToken',
    'refresh_token',
    'clientSecret',
    'jwt',
    'sessionId',
    'signature',
    'privateKey',
    'cardNumber',
    'cvv'
  ])('masks %s', key => {
    expect(redact({ [key]: 'value' })[key]).toBe('[redacted]')
  })

  it('leaves fields that only describe what happened', () => {
    const line = { provider: 'telegram', status: 502, durationMs: 12, notificationId: 'n-1' }

    expect(redact(line)).toEqual(line)
  })

  /*
   * Name-based matching, not value-based. A token-shaped string under an
   * innocent name is kept, because guessing at values would mask real data and
   * still miss anything opaque.
   */
  it('does not guess from the value', () => {
    expect(redact({ traceId: 'Bearer-looking-but-not-a-secret' })).toEqual({
      traceId: 'Bearer-looking-but-not-a-secret'
    })
  })

  it('descends into nested objects', () => {
    expect(redact({ request: { headers: { authorization: 'Bearer abc' }, path: '/v1' } })).toEqual({
      request: { headers: { authorization: '[redacted]' }, path: '/v1' }
    })
  })

  it('descends into arrays', () => {
    expect(
      redact({
        attempts: [
          { token: 'a', status: 500 },
          { token: 'b', status: 200 }
        ]
      })
    ).toEqual({
      attempts: [
        { token: '[redacted]', status: 500 },
        { token: '[redacted]', status: 200 }
      ]
    })
  })

  /*
   * A depth cap is what stops a payload nobody meant to log from costing
   * serialisation time in the request path — and what makes a cyclic structure
   * terminate instead of exhausting the stack.
   */
  it('stops descending past its depth limit', () => {
    const deep = { a: { b: { c: { d: { e: { f: { g: 'too far' } } } } } } }

    expect(redact(deep)).toEqual({ a: { b: { c: { d: { e: { f: '[redacted]' } } } } } })
  })

  it('terminates on a cyclic structure', () => {
    const cyclic: Record<string, unknown> = { name: 'loop' }
    cyclic.self = cyclic

    expect(() => redact(cyclic)).not.toThrow()
  })

  /*
   * `Logger` expands errors after this runs, and can only do so while they are
   * still `Error` instances.
   */
  it('returns an Error untouched for the logger to expand', () => {
    const error = new Error('boom')

    expect(redact({ error }).error).toBe(error)
  })

  it.each([[null], [undefined], [7], ['plain'], [true]])('returns %p unchanged', value => {
    expect(redact(value)).toBe(value)
  })

  it('does not mutate what it was given', () => {
    const original = { apiKey: 'live-key' }

    redact(original)

    expect(original.apiKey).toBe('live-key')
  })
})
