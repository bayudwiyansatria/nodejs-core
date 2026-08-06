import { configure, Logger, systemDefaults } from '../../src/index'

/**
 * Structured logging, and the threshold that decides what reaches the stream.
 *
 * This is also the one place the kernel's own code reads through `resolve`, so
 * these cases double as proof that the `configure` inversion actually feeds the
 * framework and not just direct callers.
 */
describe('Logger', () => {
  /**
   * Captures one line per `console` method without letting it reach the runner.
   */
  const captured: Record<string, string[]> = {}

  beforeEach(() => {
    configure(systemDefaults)

    for (const method of ['debug', 'info', 'warn', 'error'] as const) {
      captured[method] = []
      jest.spyOn(console, method).mockImplementation(line => {
        captured[method].push(line as string)
      })
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  /**
   * Reads back the single JSON object emitted through a given console method.
   */
  const lineFrom = (method: 'debug' | 'info' | 'warn' | 'error') => JSON.parse(captured[method][0])

  it('emits one JSON object through the method matching the level', () => {
    const log = Logger.fromEnv({})

    log.info('started')

    expect(captured.info).toHaveLength(1)
    expect(lineFrom('info')).toMatchObject({ level: 'info', message: 'started' })
  })

  it('routes each level to its own console method', () => {
    const log = Logger.fromEnv({ LOG_LEVEL: 'debug' })

    log.debug('d')
    log.info('i')
    log.warn('w')
    log.error('e')

    expect(captured.debug).toHaveLength(1)
    expect(captured.info).toHaveLength(1)
    expect(captured.warn).toHaveLength(1)
    expect(captured.error).toHaveLength(1)
  })

  it('drops lines below the configured threshold', () => {
    const log = Logger.fromEnv({})

    log.debug('too quiet')

    expect(captured.debug).toHaveLength(0)
  })

  it('lets LOG_LEVEL in the environment lower the threshold', () => {
    const log = Logger.fromEnv({ LOG_LEVEL: 'debug' })

    log.debug('now audible')

    expect(captured.debug).toHaveLength(1)
  })

  it('ignores an unrecognised LOG_LEVEL in favour of the configured one', () => {
    const log = Logger.fromEnv({ LOG_LEVEL: 'chatty' })

    log.debug('still quiet')
    log.info('still heard')

    expect(captured.debug).toHaveLength(0)
    expect(captured.info).toHaveLength(1)
  })

  it('accepts a nullish environment', () => {
    expect(() => Logger.fromEnv(null).info('fine')).not.toThrow()
    expect(() => Logger.fromEnv(undefined).info('fine')).not.toThrow()
  })

  /*
   * The threshold comes from the registered surface, so an override has to
   * reach the logger through `configure` alone — nothing else is wired.
   */
  it('takes its threshold from the registered configuration', () => {
    configure(systemDefaults, { logging: { level: 'error' } })

    const log = Logger.fromEnv({})

    log.warn('suppressed')
    log.error('kept')

    expect(captured.warn).toHaveLength(0)
    expect(captured.error).toHaveLength(1)
  })

  it('stamps the configured service name on every line', () => {
    configure(systemDefaults, { logging: { service: 'article-service' } })

    Logger.fromEnv({}).info('tagged')

    expect(lineFrom('info').service).toBe('article-service')
  })

  it('carries context onto every line', () => {
    Logger.fromEnv({}, { requestId: 'abc123' }).info('with context')

    expect(lineFrom('info').requestId).toBe('abc123')
  })

  it('adds context in a child while keeping the parent threshold', () => {
    const log = Logger.fromEnv({}, { requestId: 'abc123' })

    log.child({ service: 'ArticleService' }).info('derived')

    expect(lineFrom('info')).toMatchObject({ requestId: 'abc123', service: 'ArticleService' })
  })

  it('does not let a child leak its context back into the parent', () => {
    const log = Logger.fromEnv({})

    log.child({ extra: 'child-only' })
    log.info('parent')

    expect(lineFrom('info').extra).toBeUndefined()
  })

  it('nests structured data under a data key', () => {
    Logger.fromEnv({}).info('created', { id: 7 })

    expect(lineFrom('info').data).toEqual({ id: 7 })
  })

  /*
   * `JSON.stringify` flattens an Error to `{}`, which would silently discard
   * the only useful part of an error line.
   */
  it('expands an Error in the payload to message and stack', () => {
    Logger.fromEnv({}).error('failed', { cause: new Error('boom') })

    const { cause } = lineFrom('error').data

    expect(cause.message).toBe('boom')
    expect(typeof cause.stack).toBe('string')
  })

  it('stamps an ISO timestamp on every line', () => {
    Logger.fromEnv({}).info('timed')

    expect(Number.isNaN(Date.parse(lineFrom('info').time))).toBe(false)
  })
})
