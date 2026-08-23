/**
 * Key fragments that mark a value as a credential or a secret.
 *
 * @remarks
 * Every entry is written without separators, and a field name is stripped of
 * its own before the comparison, so one entry covers every spelling a codebase
 * accumulates: `apiKey`, `API_KEY`, `x-api-key`, and `providerApiKey` all match
 * `apikey`. Matching on a substring over-redacts rather than under-redacts,
 * which is the safe direction for a list whose whole job is to keep secrets out
 * of a stream nobody re-reads before it ships.
 *
 * Deliberately not exported: a caller adding an entry would only widen the list
 * for their own call, and a secret this misses is a defect to fix here, once,
 * for every consumer.
 */
const SENSITIVE = [
  'authorization',
  'authtoken',
  'apikey',
  'accesskey',
  'secret',
  'password',
  'passwd',
  'passphrase',
  'credential',
  'cookie',
  'token',
  'jwt',
  'bearer',
  'session',
  'signature',
  'private',
  'otp',
  'pincode',
  'cardnumber',
  'cvv',
  'cvc',
  'iban'
]

/**
 * Key fragments that mark a value as a secret whatever type it arrives as.
 *
 * @remarks
 * The rest of the list spares booleans, because a boolean cannot carry a
 * credential. These cannot take that exemption: a card number, a CVV, a PIN and
 * an OTP are all routinely held as numbers, and a numeric literal is exactly as
 * damaging in a log stream as the same digits in quotes.
 *
 * Every entry here also appears in the list above; this one only says which of
 * them ignore the type.
 */
const ALWAYS = ['cardnumber', 'cvv', 'cvc', 'pincode', 'otp', 'iban']

/**
 * What replaces a redacted value.
 *
 * @remarks
 * A marker rather than a deletion, because the two answer different questions.
 * A missing key says nothing; this says the field was present and withheld,
 * which is what an operator needs to see when the bug *is* the credential.
 */
const MASK = '[redacted]'

/**
 * How deep the walk goes before it stops descending.
 *
 * @remarks
 * A cheap guard against a payload nobody meant to log: a deep object costs
 * serialisation time in the request path, and a cyclic one would not terminate.
 * Anything past this becomes {@link MASK}, so the line stays well-formed.
 */
const MAX_DEPTH = 6

/**
 * Whether a field name looks like it holds a secret.
 *
 * @param key The field name.
 * @returns True when the name matches any fragment in {@link SENSITIVE}.
 */
const isSensitive = (key: string): boolean => {
  const name = key.toLowerCase().replace(/[-_\s.]/g, '')

  return SENSITIVE.some(fragment => name.includes(fragment))
}

/**
 * Whether a field must be masked given both its name and what it holds.
 *
 * @remarks
 * Name alone over-redacted in a way that defeated the point. An authentication
 * failure logs `tokenPresented: false` and `apiKeyPresented: false` — the two
 * facts that say *why* it failed — and a substring match on `token` and
 * `apikey` masked both, leaving a line that recorded a failure and withheld its
 * cause.
 *
 * A boolean is exempt because it cannot be a credential: there are two of them,
 * and neither is a secret. Everything else keeps name-based masking, which
 * stays predictable and errs towards over-redaction where the value could
 * actually carry something.
 *
 * @param key The field name.
 * @param value What the field holds.
 * @returns True when the field must not reach the stream.
 */
const masks = (key: string, value: unknown): boolean => {
  if (!isSensitive(key)) {
    return false
  }

  const name = key.toLowerCase().replace(/[-_\s.]/g, '')

  return typeof value !== 'boolean' || ALWAYS.some(fragment => name.includes(fragment))
}

/**
 * Replaces credential-looking fields in a structure with a redaction marker.
 *
 * @remarks
 * The last line of defence, not the first. The rule that matters is at the call
 * site — a log line carries the few fields that explain what happened, never a
 * whole request or response body — and this exists because that rule is applied
 * by people and a leaked key is not recoverable once it reaches a log stream.
 *
 * Matching is by field *name*: a value that happens to look like a token is
 * kept, and a field named like a secret is masked. Name-based matching is
 * predictable, which is what makes the result reviewable; guessing at values
 * would mask real data and still miss opaque secrets.
 *
 * The one concession to type is booleans, which pass through. `tokenPresented:
 * false` is not a credential — it is the reason an authentication failed, and
 * masking it left lines that recorded a failure while withholding its cause.
 * Names that routinely hold numeric secrets are exempt from that exemption.
 *
 * Arrays and nested objects are walked to a bounded depth. `Error` values are
 * left alone for `Logger` to expand, and every other non-object value is
 * returned as it came.
 *
 * @example
 * ```ts
 * redact({ provider: 'telegram', apiKey: 'abc' })
 * // { provider: 'telegram', apiKey: '[redacted]' }
 * ```
 *
 * @param value The structure to scrub.
 * @param depth How deep the current walk is. Callers leave this at its default.
 * @returns A copy with every sensitive field replaced by a marker.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.2.1
 * @since 1.2.0
 */
export function redact<T>(value: T, depth = 0): T {
  if (value === null || typeof value !== 'object' || value instanceof Error) {
    return value
  }

  if (depth >= MAX_DEPTH) {
    return MASK as unknown as T
  }

  if (Array.isArray(value)) {
    return value.map(entry => redact(entry, depth + 1)) as unknown as T
  }

  const out: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = masks(key, entry) ? MASK : redact(entry, depth + 1)
  }

  return out as unknown as T
}
