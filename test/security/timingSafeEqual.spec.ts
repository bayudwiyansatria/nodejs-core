import { timingSafeEqual } from '../../src/index'

/**
 * Comparison used on secrets.
 *
 * The timing property itself is not assertable in a unit test — a benchmark
 * would be flaky and prove little. What is assertable, and what a careless
 * "optimisation" would break, is that the function never short-circuits its way
 * to a wrong *answer*: the equality result must stay exactly right for the edge
 * cases an early return would get wrong.
 */
describe('timingSafeEqual', () => {
  it('accepts identical strings', () => {
    expect(timingSafeEqual('s3cr3t', 's3cr3t')).toBe(true)
  })

  it('rejects strings differing only in the last character', () => {
    expect(timingSafeEqual('s3cr3t', 's3cr3u')).toBe(false)
  })

  it('rejects strings differing only in the first character', () => {
    expect(timingSafeEqual('s3cr3t', 'S3cr3t')).toBe(false)
  })

  it('rejects a prefix of the expected value', () => {
    expect(timingSafeEqual('s3cr3t', 's3cr3')).toBe(false)
  })

  it('rejects a value the expected one is a prefix of', () => {
    expect(timingSafeEqual('s3cr3', 's3cr3t')).toBe(false)
  })

  it('accepts two empty strings', () => {
    expect(timingSafeEqual('', '')).toBe(true)
  })

  it('rejects an empty candidate against a real secret', () => {
    expect(timingSafeEqual('', 's3cr3t')).toBe(false)
  })

  /*
   * Comparison is over UTF-8 bytes, not UTF-16 code units, so a multi-byte
   * character must compare by its encoded form. Two strings of equal `.length`
   * but different byte length are the case a naive index-wise loop gets wrong.
   */
  it('compares multi-byte characters by their encoded bytes', () => {
    expect(timingSafeEqual('café', 'café')).toBe(true)
    expect(timingSafeEqual('café', 'cafe')).toBe(false)
  })

  it('rejects equal-length strings whose byte lengths differ', () => {
    expect('é'.length).toBe('e'.length)
    expect(timingSafeEqual('é', 'e')).toBe(false)
  })
})
