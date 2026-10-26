import { ConfigurationError, configure, resolve } from '../../src/index'

describe('resolve', () => {
  /**
   * A two-module surface standing in for the assembled real one: one module the
   * tests override, one they leave alone.
   */
  const defaults = {
    cache: { driver: 'memory', ttl: 300 },
    logging: { level: 'info', service: 'app' }
  }

  beforeEach(() => {
    configure(defaults)
  })

  it('returns the default when nothing overrides it', () => {
    expect(resolve('cache')).toEqual({ driver: 'memory', ttl: 300 })
  })

  it('merges per field, so a partial override keeps the rest of the module', () => {
    configure(defaults, { cache: { ttl: 60 } })

    expect(resolve('cache')).toEqual({ driver: 'memory', ttl: 60 })
  })

  it('ignores an override field explicitly set to undefined', () => {
    configure(defaults, { cache: { ttl: undefined } })

    expect(resolve('cache')).toEqual({ driver: 'memory', ttl: 300 })
  })

  it('leaves modules the overrides do not mention entirely alone', () => {
    configure(defaults, { cache: { ttl: 60 } })

    expect(resolve('logging')).toEqual({ level: 'info', service: 'app' })
  })

  it('does not mutate the registered defaults', () => {
    configure(defaults, { cache: { ttl: 60 } })
    resolve('cache')

    expect(defaults.cache.ttl).toBe(300)
  })

  it('accepts an override for a module with no default at all', () => {
    configure(defaults, { extra: { enabled: true } } as never)

    expect(resolve('extra')).toEqual({ enabled: true })
  })

  /*
   * The diagnostic that exists so the double-loaded-package failure names
   * itself. Without it every lookup would return `undefined` and the fault
   * would surface much further downstream, wearing the name of whichever
   * binding dereferenced the settings first.
   */
  it('throws a ConfigurationError for a module registered nowhere', () => {
    expect(() => resolve('absent')).toThrow(ConfigurationError)
  })

  it('names the module and both likely causes in the error', () => {
    let error: ConfigurationError

    try {
      resolve('absent')
    } catch (thrown) {
      error = thrown as ConfigurationError
    }

    expect(error.module).toBe('absent')
    expect(error.message).toContain('configure()')
    expect(error.message).toContain('two copies')
  })

  it('throws before configure has ever run', () => {
    configure({})

    expect(() => resolve('cache')).toThrow(ConfigurationError)
  })
})

describe('configure', () => {
  it('replaces the surface rather than merging into it', () => {
    configure({ cache: { driver: 'memory' } })
    configure({ logging: { level: 'debug' } })

    expect(resolve('logging')).toEqual({ level: 'debug' })
    expect(() => resolve('cache')).toThrow(ConfigurationError)
  })

  it('drops overrides from a previous call along with the defaults', () => {
    configure({ cache: { driver: 'memory', ttl: 300 } }, { cache: { ttl: 60 } })
    configure({ cache: { driver: 'memory', ttl: 300 } })

    expect(resolve('cache')).toEqual({ driver: 'memory', ttl: 300 })
  })

  it('treats omitted overrides as none', () => {
    configure({ cache: { driver: 'memory' } })

    expect(resolve('cache')).toEqual({ driver: 'memory' })
  })
})
