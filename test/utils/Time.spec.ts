import { Time } from '../../src/index'

describe('Time.since', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('reports the elapsed milliseconds', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000)
    const start = Time.now()

    jest.spyOn(Date, 'now').mockReturnValue(1_250)

    expect(Time.since(start)).toBe(250)
  })

  it('clamps to zero when the clock steps backwards', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000)
    const start = Time.now()

    jest.spyOn(Date, 'now').mockReturnValue(900)

    expect(Time.since(start)).toBe(0)
  })

  it('reports zero for an instantaneous span', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_000)

    expect(Time.since(Time.now())).toBe(0)
  })
})

describe('Time.nowIso', () => {
  it('produces a parseable ISO-8601 timestamp', () => {
    const stamp = Time.nowIso()

    expect(Number.isNaN(Date.parse(stamp))).toBe(false)
    expect(stamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })
})

describe('Time.now', () => {
  it('reports epoch milliseconds', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)

    expect(Time.now()).toBe(1_700_000_000_000)

    jest.restoreAllMocks()
  })
})
