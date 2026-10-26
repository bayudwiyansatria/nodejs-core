import { List } from '../../src/index'

describe('List.chunk', () => {
  it('splits an exact multiple into equal runs', () => {
    expect(List.chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4]
    ])
  })

  it('leaves the remainder in a shorter final run', () => {
    const batches = List.chunk([1, 2, 3, 4, 5], 2)

    expect(batches).toEqual([[1, 2], [3, 4], [5]])
  })

  it('returns one run when the size covers everything', () => {
    expect(List.chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]])
  })

  it('returns nothing for an empty list', () => {
    expect(List.chunk([], 3)).toEqual([])
  })

  it('does not modify the input', () => {
    const values = [1, 2, 3]

    List.chunk(values, 2)

    expect(values).toEqual([1, 2, 3])
  })

  it('treats a zero size as one rather than looping forever', () => {
    expect(List.chunk([1, 2, 3], 0)).toEqual([[1], [2], [3]])
  })

  it('treats a negative size as one', () => {
    expect(List.chunk([1, 2], -5)).toEqual([[1], [2]])
  })

  it('treats a non-numeric size as one', () => {
    expect(List.chunk([1, 2], Number.NaN)).toEqual([[1], [2]])
  })

  it('treats an infinite size as one', () => {
    expect(List.chunk([1, 2], Number.POSITIVE_INFINITY)).toEqual([[1], [2]])
  })

  it('truncates a fractional size rather than slicing at drifting boundaries', () => {
    const batches = List.chunk([1, 2, 3, 4, 5], 2.9)

    expect(batches).toEqual([[1, 2], [3, 4], [5]])
  })
})
