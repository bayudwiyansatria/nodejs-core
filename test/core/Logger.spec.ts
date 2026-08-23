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

  /*
   * Flat, not nested. A collector indexes what it is given, so `data.status`
   * costs every query and every dashboard column a prefix that says nothing.
   */
  it('flattens structured data onto the line', () => {
    Logger.fromEnv({}).info('article.created', { id: 7 })

    expect(lineFrom('info')).toMatchObject({ event: 'article.created', id: 7 })
    expect(lineFrom('info').data).toBeUndefined()
  })

  /*
   * The redaction pass is `redact`'s to prove in detail; what belongs here is
   * that the logger actually runs it, because a payload reaching the stream
   * unscrubbed is not something a later fix can take back.
   */
  it('scrubs credential-shaped fields out of the payload', () => {
    Logger.fromEnv({}).info('external_api.request', { provider: 'telegram', apiKey: 'live-key' })

    expect(lineFrom('info')).toMatchObject({ provider: 'telegram', apiKey: '[redacted]' })
  })

  /*
   * `JSON.stringify` flattens an Error to `{}`, which would silently discard
   * the only useful part of an error line.
   */
  it('expands an Error in the payload to message and stack', () => {
    Logger.fromEnv({}).error('failed', { cause: new Error('boom') })

    const { cause } = lineFrom('error')

    expect(cause.message).toBe('boom')
    expect(typeof cause.stack).toBe('string')
  })

  it('stamps an ISO timestamp on every line', () => {
    Logger.fromEnv({}).info('timed')

    expect(Number.isNaN(Date.parse(lineFrom('info').time))).toBe(false)
  })

  /*
   * `event` names what happened for a query; `message` says it in English for
   * whoever is reading. Most log viewers show only the latter, so it is never
   * allowed to be empty — the event name stands in when nobody wrote one.
   */
  describe('message', () => {
    it('falls back to the event name when none is given', () => {
      Logger.fromEnv({}).info('notification.sent')

      expect(lineFrom('info')).toMatchObject({
        event: 'notification.sent',
        message: 'notification.sent'
      })
    })

    it('keeps the event name intact when a sentence is given', () => {
      Logger.fromEnv({}).info('notification.sent', { provider: 'telegram' }, 'Notification sent via telegram')

      expect(lineFrom('info')).toMatchObject({
        event: 'notification.sent',
        message: 'Notification sent via telegram',
        provider: 'telegram'
      })
    })

    it('emits a sentence with no payload', () => {
      Logger.fromEnv({}).warn('request.completed', undefined, 'Request completed: GET / (404)')

      expect(lineFrom('warn').message).toBe('Request completed: GET / (404)')
    })
  })

  /*
   * Both context and payload are merged onto the line, and either can arrive
   * carrying a key the line already owns — a forwarded upstream record most
   * of all, where `level` and `message` are exactly what its own fields are
   * called. A payload that wins would file an error line as info, and a
   * severity filter would never show it again.
   */
  describe('reserved keys', () => {
    it.each(['level', 'event', 'message'])('does not let a payload overwrite %s', key => {
      Logger.fromEnv({}).error('request.failed', { [key]: 'hijacked' })

      expect(lineFrom('error')[key]).not.toBe('hijacked')
    })

    it('does not let context overwrite the level', () => {
      Logger.fromEnv({}, { level: 'debug' }).error('request.failed')

      expect(lineFrom('error').level).toBe('error')
    })
  })

  /*
   * The kernel narrows nothing on its own. Deciding a field is redundant means
   * knowing what the runtime already records, which is an adapter's knowledge —
   * so the default here admits everything and `LOG_FIELDS` does the narrowing.
   */
  describe('field selection', () => {
    it('emits every context field by default', () => {
      Logger.fromEnv({ SERVICE_NAME: 'mcp-server' }, { requestId: 'r1', colo: 'SIN' }).info('tagged')

      expect(lineFrom('info')).toMatchObject({ service: 'mcp-server', requestId: 'r1', colo: 'SIN' })
    })

    it('keeps only the declared context fields', () => {
      Logger.fromEnv(
        { SERVICE_NAME: 'mcp-server', LOG_FIELDS: 'requestId,method' },
        { requestId: 'r1', method: 'POST', colo: 'SIN' }
      ).info('narrowed')

      const line = lineFrom('info')

      expect(line).toMatchObject({ requestId: 'r1', method: 'POST' })
      expect(line.colo).toBeUndefined()
      expect(line.service).toBeUndefined()
    })

    it('never filters the payload', () => {
      Logger.fromEnv({ LOG_FIELDS: 'requestId' }, { colo: 'SIN' }).warn('authentication.failed', {
        reason: 'api_key_absent'
      })

      expect(lineFrom('warn').reason).toBe('api_key_absent')
    })

    /*
     * An empty declaration is a deployment saying the level, the event and the
     * message are the whole line — not the same as leaving it unset, which is
     * why it cannot fall through to the surface.
     */
    it('treats an empty declaration as no context at all', () => {
      Logger.fromEnv({ SERVICE_NAME: 'mcp-server', LOG_FIELDS: '' }, { requestId: 'r1' }).info('bare')

      const line = lineFrom('info')

      expect(line).toMatchObject({ level: 'info', event: 'bare', message: 'bare' })
      expect(line.requestId).toBeUndefined()
      expect(line.service).toBeUndefined()
    })

    it('reads a star as every field', () => {
      Logger.fromEnv({ LOG_FIELDS: '*' }, { requestId: 'r1', colo: 'SIN' }).info('everything')

      expect(lineFrom('info')).toMatchObject({ requestId: 'r1', colo: 'SIN' })
    })

    it('tolerates spacing in the declaration', () => {
      Logger.fromEnv({ LOG_FIELDS: ' requestId , method ' }, { requestId: 'r1', method: 'GET' }).info('spaced')

      expect(lineFrom('info')).toMatchObject({ requestId: 'r1', method: 'GET' })
    })

    it('takes the declaration from the configured surface', () => {
      configure(systemDefaults, { logging: { fields: ['requestId'] } })

      Logger.fromEnv({}, { requestId: 'r1', colo: 'SIN' }).info('from surface')

      expect(lineFrom('info').requestId).toBe('r1')
      expect(lineFrom('info').colo).toBeUndefined()
    })

    it('prefers the environment over the configured surface', () => {
      configure(systemDefaults, { logging: { fields: ['requestId'] } })

      Logger.fromEnv({ LOG_FIELDS: 'colo' }, { requestId: 'r1', colo: 'SIN' }).info('env wins')

      expect(lineFrom('info').colo).toBe('SIN')
      expect(lineFrom('info').requestId).toBeUndefined()
    })

    it('drops the timestamp when it is not declared', () => {
      Logger.fromEnv({ LOG_FIELDS: 'requestId' }, { requestId: 'r1' }).info('untimed')

      expect(lineFrom('info').time).toBeUndefined()
    })

    it('carries the declaration into a child', () => {
      const log = Logger.fromEnv({ LOG_FIELDS: 'requestId' }, { requestId: 'r1' })

      log.child({ colo: 'SIN' }).info('derived')

      expect(lineFrom('info').requestId).toBe('r1')
      expect(lineFrom('info').colo).toBeUndefined()
    })
  })
})
