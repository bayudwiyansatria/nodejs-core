import { redact } from '../../src/index'

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
   * Found in production: every field on an `authentication.failed` line was
   * masked, including the booleans saying *why* it failed. The line recorded a
   * failure and withheld its cause. A boolean cannot be a credential — there
   * are two of them, and neither is a secret.
   */
  describe('booleans', () => {
    it('keeps the booleans that explain an authentication failure', () => {
      const line = {
        verificationConfigured: true,
        tokenPresented: false,
        fixedTokenConfigured: true,
        apiKeyPresented: false
      }

      expect(redact(line)).toEqual(line)
    })

    it('still masks the credential itself on the same line', () => {
      expect(redact({ tokenPresented: true, token: 'live-token' })).toEqual({
        tokenPresented: true,
        token: '[redacted]'
      })
    })

    /*
     * The exemption has its own exemption. A card number, a CVV, a PIN and an
     * OTP are routinely numbers, and digits in a log stream are as damaging
     * unquoted as quoted — so those names ignore the type entirely.
     */
    it.each(['cardNumber', 'cvv', 'cvc', 'pinCode', 'otp', 'iban'])('masks %s whatever type it arrives as', key => {
      expect(redact({ [key]: 4111111111111111 })[key]).toBe('[redacted]')
      expect(redact({ [key]: true })[key]).toBe('[redacted]')
    })

    it('masks a credential-named number that is not one of those', () => {
      expect(redact({ apiKey: 12345 })).toEqual({ apiKey: '[redacted]' })
    })
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
