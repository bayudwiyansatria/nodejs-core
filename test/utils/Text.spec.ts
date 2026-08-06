import { Text } from '../../src/index'

/**
 * Pure string helpers the framework itself uses.
 *
 * `truncate` caps a telemetry sampling key, and the rest normalise input, so the
 * cases that matter are the boundary and the nullish ones — everything a caller
 * would otherwise have to guard before calling.
 */
describe('Text.truncate', () => {
  it('leaves a string shorter than the cap untouched', () => {
    expect(Text.truncate('abc', 10)).toBe('abc')
  })

  it('leaves a string exactly at the cap untouched', () => {
    expect(Text.truncate('abcde', 5)).toBe('abcde')
  })

  it('cuts a string longer than the cap down to it', () => {
    expect(Text.truncate('abcdefgh', 5)).toBe('abcde')
  })

  it('treats a zero cap as producing nothing', () => {
    expect(Text.truncate('abc', 0)).toBe('')
  })

  it('substitutes an empty string for a nullish value', () => {
    expect(Text.truncate(undefined as unknown as string, 5)).toBe('')
    expect(Text.truncate(null as unknown as string, 5)).toBe('')
  })
})

describe('Text.trim', () => {
  it('removes surrounding whitespace', () => {
    expect(Text.trim('  padded  ')).toBe('padded')
  })

  it('leaves interior whitespace alone', () => {
    expect(Text.trim('  two words  ')).toBe('two words')
  })

  it('returns an empty string for nullish input', () => {
    expect(Text.trim(undefined)).toBe('')
    expect(Text.trim(null)).toBe('')
  })
})

describe('Text.isBlank', () => {
  it('treats an empty string as blank', () => {
    expect(Text.isBlank('')).toBe(true)
  })

  it('treats whitespace-only input as blank', () => {
    expect(Text.isBlank('   \t\n ')).toBe(true)
  })

  it('treats nullish input as blank', () => {
    expect(Text.isBlank(undefined)).toBe(true)
    expect(Text.isBlank(null)).toBe(true)
  })

  it('does not treat a padded value as blank', () => {
    expect(Text.isBlank('  x  ')).toBe(false)
  })
})
