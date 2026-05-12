import { createLibraryMetadata, getHealthStatus } from '../src/index'

describe('template library entrypoint', () => {
  it('returns default health status', () => {
    const result = getHealthStatus()

    expect(result.ok).toBe(true)
    expect(result.message).toBe('library-ready')
    expect(typeof result.timestamp).toBe('string')
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false)
  })

  it('creates metadata object', () => {
    const result = createLibraryMetadata('demo-lib', '1.0.0', 'demo description')

    expect(result).toEqual({
      name: 'demo-lib',
      version: '1.0.0',
      description: 'demo description'
    })
  })
})
