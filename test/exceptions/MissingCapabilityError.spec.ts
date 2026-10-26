import { MissingCapabilityError } from '../../src/index'

describe('MissingCapabilityError', () => {
  it('is an Error', () => {
    expect(new MissingCapabilityError('cache')).toBeInstanceOf(Error)
  })

  it('reports its own name', () => {
    expect(new MissingCapabilityError('cache').name).toBe('MissingCapabilityError')
  })

  it('names the capability that could not be resolved', () => {
    expect(new MissingCapabilityError('cache').capability).toBe('cache')
  })

  it('builds a message naming the capability when none is given', () => {
    expect(new MissingCapabilityError('cache').message).toContain('cache')
  })

  it('takes a caller-supplied message verbatim', () => {
    const error = new MissingCapabilityError('cache', 'No cache is configured for this deployment.')

    expect(error.message).toBe('No cache is configured for this deployment.')
    expect(error.capability).toBe('cache')
  })

  /*
   * The property an adapter package relies on: its own subclass, defined in a
   * different package, must still be catchable as this one. That only holds
   * while a single copy of this package is loaded — which is why the adapter's
   * bundler has to treat it as external.
   */
  it('is catchable as the base from a subclass defined elsewhere', () => {
    class MissingResourceError extends MissingCapabilityError {
      constructor(resource: string) {
        super(resource, `Missing resource '${resource}'.`)
        this.name = 'MissingResourceError'
      }
    }

    const error = new MissingResourceError('cache')

    expect(error).toBeInstanceOf(MissingCapabilityError)
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('MissingResourceError')
    expect(error.capability).toBe('cache')
  })
})
