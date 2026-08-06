/**
 * @function
 *
 * Compares two strings without leaking, through how long the comparison took,
 * how much of the expected value the caller already got right.
 *
 * @remarks
 * JavaScript's `===` on strings returns at the first differing byte. Over many
 * requests that difference is measurable, and it turns guessing a secret from
 * an exponential search into a linear one: an attacker who can time responses
 * recovers the value one byte at a time. This walks the whole buffer regardless
 * and accumulates the difference with a bitwise OR, so the work done is the
 * same for a value that matches on no bytes as for one that matches on all but
 * the last.
 *
 * Length is the exception and cannot be hidden — a differing length exits
 * immediately. That leaks only the size of the secret, which is not the part
 * worth protecting.
 *
 * Use this for any value a caller could otherwise guess a byte at a time: API
 * keys, webhook secrets, signatures. Comparing a hash of a value is not a
 * substitute, because the hashes are compared the same way.
 *
 * @param a First value to compare.
 * @param b Second value to compare.
 * @returns True only when both values are byte-for-byte identical.
 *
 * @example
 * ```ts
 * if (!timingSafeEqual(provided, expected)) {
 *   return ctx.json({ message: 'Unauthorized' }, 401)
 * }
 * ```
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export const timingSafeEqual = (a: string, b: string): boolean => {
  const encoder = new TextEncoder()
  const bufferA = encoder.encode(a)
  const bufferB = encoder.encode(b)

  if (bufferA.byteLength !== bufferB.byteLength) {
    return false
  }

  let mismatch = 0

  for (let i = 0; i < bufferA.byteLength; i++) {
    mismatch |= bufferA[i] ^ bufferB[i]
  }

  return mismatch === 0
}
