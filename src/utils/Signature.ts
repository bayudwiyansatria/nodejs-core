/**
 * The runtime's imported-key handle.
 *
 * @remarks
 * Derived from `crypto.subtle` rather than written as `CryptoKey`. That name is
 * only ambient with a runtime-specific lib (`DOM`, `WebWorker`) in scope, and
 * this package compiles with neither so anything runtime-specific fails the
 * build. WebCrypto itself is in the minimum API every target runtime provides,
 * so the value is always there; only the global type name is missing.
 *
 * Never reaches the public surface — `sign` returns a string, `verify` a boolean
 * — so it does not leak into the generated declarations.
 */
type SigningKey = Awaited<ReturnType<typeof crypto.subtle.importKey>>

/**
 * Imported HMAC keys, cached for the life of the isolate and keyed by secret.
 *
 * @remarks
 * `crypto.subtle.importKey` is not free, and the same one or two secrets are
 * used on every request, so importing per call would be pure waste. Keyed by
 * the secret itself so a rotated value produces a new entry rather than a
 * stale key — the map is bounded by how many distinct secrets a process signs
 * with, which is a small number by construction.
 */
const keys = new Map<string, Promise<SigningKey>>()

/**
 * Imports a signing key, reusing the cached one when the secret is unchanged.
 *
 * @param secret The shared secret to derive the key from.
 * @returns A key usable for HMAC-SHA-256 sign and verify.
 */
const signingKey = (secret: string): Promise<SigningKey> => {
  const cached = keys.get(secret)

  if (cached) {
    return cached
  }

  const key = crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )

  keys.set(secret, key)

  return key
}

/**
 * @class
 *
 * Stateless signed tokens over HMAC-SHA-256.
 *
 * @remarks
 * For the case where a value has to travel through somewhere you do not control
 * — a query string, a URL fragment, a cookie, a redirect — and come back
 * unmodified. The signature is *verified* rather than looked up, so issuing and
 * checking one costs no storage read, nothing accumulates, and nothing has to
 * be expired.
 *
 * What this is not: it does not hide the value, it proves the value is one you
 * issued. Anyone holding the token can read what it covers. And because there
 * is no stored record, a token cannot be revoked before whatever bound it
 * expires — build an expiry into the signed value when that matters.
 *
 * Reach for it when an identifier alone is doing work it cannot do. An
 * unguessable id is not a secret: it travels in URLs and therefore into access
 * logs, proxies, and referrer headers. A signature over that id is what makes
 * presenting it evidence of anything.
 *
 * @example
 * ```ts
 * // Issue a token a client presents to rejoin a session it already owns.
 * const token = await Signature.sign(env.API_AUTH_TOKEN_VALUE, 'session/resume/v1', sessionId)
 *
 * // On the way back in.
 * if (!(await Signature.verify(env.API_AUTH_TOKEN_VALUE, 'session/resume/v1', sessionId, token))) {
 *   // Start fresh rather than reject: a stale token should not be an error page.
 * }
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export class Signature {
  /**
   * Signs a value under a scope.
   *
   * @remarks
   * The scope is domain separation, and it is not optional decoration. Two
   * different kinds of token signed with the same secret and no scope are
   * interchangeable — a signature issued for one purpose verifies for the
   * other, and whichever check is laxer becomes the one that matters. Give
   * every use its own scope, and version it (`.../v1`), so changing what a
   * token covers invalidates the old ones instead of silently accepting them.
   *
   * @param secret The shared secret. Any sufficiently random value; reusing an
   *   existing API token is fine and saves operating a second secret.
   * @param scope What this token is for, e.g. `session/resume/v1`.
   * @param value The value being signed.
   * @returns The signature, hex-encoded. An empty string when `secret` is
   *   unset, which callers should read as "cannot issue" rather than as a
   *   token.
   */
  public static async sign(secret: string, scope: string, value: string): Promise<string> {
    if (!secret) {
      return ''
    }

    const key = await signingKey(secret)
    const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${scope}:${value}`))

    return [...new Uint8Array(signature)].map(byte => byte.toString(16).padStart(2, '0')).join('')
  }

  /**
   * Checks a token against a value and scope.
   *
   * @remarks
   * Goes through `crypto.subtle.verify` rather than re-signing and comparing
   * strings, so the comparison is constant-time for free. A malformed token is
   * `false` rather than a throw — it arrives from outside, so it is input, not
   * an error.
   *
   * @param secret The shared secret the token was signed with.
   * @param scope The scope the token was issued under. Must match exactly.
   * @param value The value being claimed.
   * @param token The token presented.
   * @returns `true` only when the token was issued for that value under that
   *   scope with that secret.
   */
  public static async verify(secret: string, scope: string, value: string, token: string): Promise<boolean> {
    if (!secret || !/^[0-9a-f]{64}$/.test(token)) {
      return false
    }

    const signature = new Uint8Array(32)

    for (let i = 0; i < 32; i++) {
      signature[i] = parseInt(token.slice(i * 2, i * 2 + 2), 16)
    }

    const key = await signingKey(secret)

    return await crypto.subtle.verify('HMAC', key, signature, new TextEncoder().encode(`${scope}:${value}`))
  }
}
