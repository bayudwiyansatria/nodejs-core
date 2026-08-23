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

    log.info('service.started')

    expect(captured.info).toHaveLength(1)
    expect(lineFrom('info')).toMatchObject({ level: 'info', event: 'service.started' })
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

  /*
   * Every line says which deployment wrote it, so a line still means something
   * once it has left the console it was written to — in an export, a Logpush
   * sink, or a stream shared with another service.
   */
  it('stamps the service name from the environment on every line', () => {
    Logger.fromEnv({ SERVICE_NAME: 'mcp-server' }).info('service.started')

    expect(lineFrom('info').service).toBe('mcp-server')
  })

  it('falls back to the configured service name with no environment', () => {
    configure(systemDefaults, { logging: { service: 'article-service' } })

    Logger.fromEnv({}).info('tagged')

    expect(lineFrom('info').service).toBe('article-service')
  })

  /*
   * The environment wins, and the order is the whole point: `SERVICE_NAME` sits
   * beside the deployment's own name, where a rename that misses it is visible
   * in the same diff. A constant compiled in from `config/` is in a file a
   * rename does not touch — which is how a Worker spent production calling
   * itself `cloudflare-boilerplate`.
   */
  it('prefers the environment over a stale configured name', () => {
    configure(systemDefaults, { logging: { service: 'cloudflare-boilerplate' } })

    Logger.fromEnv({ SERVICE_NAME: 'cloud-cost-worker' }).info('tagged')

    expect(lineFrom('info').service).toBe('cloud-cost-worker')
  })

  /*
   * The failure this guards is silence. A deployment that forgets
   * `SERVICE_NAME` used to emit lines with the key simply missing: ordinary
   * looking, healthy looking, and useless the moment two services shared a
   * stream. `unknown` makes it a value a query can find.
   */
  it('says so when neither the environment nor the surface names one', () => {
    Logger.fromEnv({}).info('untagged')

    expect(lineFrom('info').service).toBe('unknown')
  })

  it.each([[''], ['   ']])('treats %p as unnamed rather than as a name', value => {
    Logger.fromEnv({ SERVICE_NAME: value }).info('untagged')

    expect(lineFrom('info').service).toBe('unknown')
  })

  it('never leaves the service key off a line', () => {
    Logger.fromEnv(null).info('untagged')

    expect(lineFrom('info')).toHaveProperty('service')
  })

  it('carries context onto every line', () => {
    Logger.fromEnv({}, { requestId: 'abc123' }).info('with context')

    expect(lineFrom('info').requestId).toBe('abc123')
  })

  it('adds context in a child while keeping the parent threshold', () => {
    const log = Logger.fromEnv({}, { requestId: 'abc123' })

    log.child({ component: 'ArticleService' }).info('derived')

    expect(lineFrom('info')).toMatchObject({ requestId: 'abc123', component: 'ArticleService' })
  })

  it('does not let a child leak its context back into the parent', () => {
    const log = Logger.fromEnv({})

    log.child({ extra: 'child-only' })
    log.info('parent')

    expect(lineFrom('info').extra).toBeUndefined()
  })

  it('nests structured data under a data key', () => {
    Logger.fromEnv({}).info('article.created', { id: 7 })

    expect(lineFrom('info').data).toEqual({ id: 7 })
  })

  /*
   * The redaction pass is `redact`'s to prove in detail; what belongs here is
   * that the logger actually runs it, because a payload reaching the stream
   * unscrubbed is not something a later fix can take back.
   */
  it('scrubs credential-shaped fields out of the payload', () => {
    Logger.fromEnv({}).info('external_api.request', { provider: 'telegram', apiKey: 'live-key' })

    expect(lineFrom('info').data).toEqual({ provider: 'telegram', apiKey: '[redacted]' })
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
