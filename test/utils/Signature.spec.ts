import { Signature } from '../../src/index'

describe('Signature', () => {
  const secret = 'shared-secret'
  const scope = 'password-reset'
  const value = 'user-42'

  it('verifies a token against the inputs that produced it', async () => {
    const token = await Signature.sign(secret, scope, value)

    await expect(Signature.verify(secret, scope, value, token)).resolves.toBe(true)
  })

  it('rejects a token issued under a different secret', async () => {
    const token = await Signature.sign('other-secret', scope, value)

    await expect(Signature.verify(secret, scope, value, token)).resolves.toBe(false)
  })

  /*
   * Scope is what stops a token minted for one purpose being replayed at
   * another. If it were not part of the signed payload, a password-reset token
   * would verify as an email-confirmation token.
   */
  it('rejects a token issued for a different scope', async () => {
    const token = await Signature.sign(secret, 'email-confirm', value)

    await expect(Signature.verify(secret, scope, value, token)).resolves.toBe(false)
  })

  it('rejects a token issued for a different value', async () => {
    const token = await Signature.sign(secret, scope, 'user-43')

    await expect(Signature.verify(secret, scope, value, token)).resolves.toBe(false)
  })

  it('rejects a tampered token', async () => {
    const token = await Signature.sign(secret, scope, value)
    const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`

    await expect(Signature.verify(secret, scope, value, tampered)).resolves.toBe(false)
  })

  it('rejects an empty token', async () => {
    await expect(Signature.verify(secret, scope, value, '')).resolves.toBe(false)
  })

  it('rejects a token that is not valid hexadecimal', async () => {
    await expect(Signature.verify(secret, scope, value, 'not a token')).resolves.toBe(false)
  })

  it('is deterministic, so the same inputs always produce the same token', async () => {
    const first = await Signature.sign(secret, scope, value)
    const second = await Signature.sign(secret, scope, value)

    expect(first).toBe(second)
  })

  /*
   * Keys are cached by secret for the life of the isolate. A rotated secret
   * must therefore produce a new cache entry rather than reuse a stale key —
   * the case that would silently keep honouring the old secret.
   */
  it('honours a rotated secret rather than a cached key', async () => {
    const before = await Signature.sign(secret, scope, value)
    const after = await Signature.sign('rotated-secret', scope, value)

    expect(after).not.toBe(before)
    await expect(Signature.verify('rotated-secret', scope, value, after)).resolves.toBe(true)
    await expect(Signature.verify(secret, scope, value, after)).resolves.toBe(false)
  })
})
