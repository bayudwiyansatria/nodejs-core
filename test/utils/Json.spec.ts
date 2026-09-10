import { Json } from '../../src/index'

/**
 * Parsing a body the caller did not write.
 *
 * Every interesting case is a way the input fails to be a usable object, since
 * that is the whole reason the helper exists: `JSON.parse` answers those with an
 * exception, and a handler that has to `try`/`catch` around every body read is
 * the thing being avoided.
 */
describe('Json.parse', () => {
  it('parses an object', () => {
    expect(Json.parse<{ symbol: string }>('{"symbol":"BBCA"}')).toEqual({ symbol: 'BBCA' })
  })

  it('parses an array', () => {
    expect(Json.parse<number[]>('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('answers null for malformed syntax rather than throwing', () => {
    expect(Json.parse('{"symbol":')).toBeNull()
  })

  it('answers null for an empty body', () => {
    expect(Json.parse('')).toBeNull()
  })

  it('answers null for a bare null literal', () => {
    expect(Json.parse('null')).toBeNull()
  })

  it('preserves a falsy primitive that is still a value', () => {
    expect(Json.parse<number>('0')).toBe(0)
    expect(Json.parse<boolean>('false')).toBe(false)
  })
})
