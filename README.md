# Core

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.1%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)
[![License](https://img.shields.io/github/license/bayudwiyansatria/nodejs-core)](LICENSE)
[![Version](https://img.shields.io/github/package-json/v/bayudwiyansatria/nodejs-core)](package.json)

The kernel every other package depends on: capability interfaces, configuration resolution, structured logging, and the
service response contract.

## What this is

A layer that names no vendor and no HTTP framework. It describes what an application needs from its platform — a cache,
relational storage, a queue — and leaves an adapter package to say what provides it.

```
@bayudwiyansatria/core          ← you are here    knows no vendor, no framework
        ▲
@bayudwiyansatria/cloudflare                      the Cloudflare adapters
        ▲
your Worker                                       the application
```

An ESLint rule enforces that boundary. If something here appears to need `@cloudflare/workers-types` or `hono`, that is
the signal it belongs in an adapter package instead.

## Install

```bash
npm install @bayudwiyansatria/core
```

## Quick start

```ts
import { configure, Logger, resolve, systemDefaults } from '@bayudwiyansatria/core'
import { cloudflareDefaults } from '@bayudwiyansatria/cloudflare'

// Once, at startup, before anything reads a setting.
configure({ ...systemDefaults, ...cloudflareDefaults }, overrides)

const log = Logger.fromEnv(env, { service: 'ArticleService' })
log.info('article created', { id: 42 })
```

## What it exports

| Category      | Exports                                                              |
| ------------- | -------------------------------------------------------------------- |
| Contracts     | `Service`, `APIResponse`                                             |
| Capabilities  | `Capability` and the twelve interfaces over it, plus the `Noop*` four |
| Configuration | `configure`, `resolve`, `systemDefaults`, the settings shapes         |
| Observability | `Logger`, `LogContext`                                               |
| Security      | `timingSafeEqual`                                                    |
| Errors        | `MissingCapabilityError`, `ConfigurationError`                       |
| Utilities     | `Signature`, `Text`, `Time`                                          |

## The two rules worth knowing

**Configure before you resolve.** `configure()` seeds a module-level registry that `resolve()` reads. Anything that
looks a setting up before it has run gets a `ConfigurationError` naming both likely causes.

**Adapters must treat this package as external.** The registry is module state and `MissingCapabilityError` is a class
identity, so a bundler that inlines a second copy breaks both silently — `configure()` seeds one registry while the
adapter reads the other, and `instanceof` stops matching. `@bayudwiyansatria/cloudflare` guards against this on its own
built bundles with `npm run verify:external`.

## Project structure

```text
src/
  index.ts              public API barrel — the entire published surface
  capabilities/         what an application needs from a platform, without naming one
    noop/               implementations that satisfy a capability without providing it
  config/               configure(), resolve(), and the kernel's own settings
  observability/        Logger, LogContext
  security/             timingSafeEqual
  errors/               MissingCapabilityError, ConfigurationError
  utils/                Signature, Text, Time
  Service.ts            abstract base: ok() / fail() builders
  APIResponse.ts        the envelope that contract is expressed in
test/                   Jest specs mirroring src/
docs/                   developer book
```

## Local development

```bash
npm install
npm test           # lint + jest
npm run build      # four artifacts under lib/
npm run build:docs
```

Documentation is a build gate rather than an afterthought: `typedoc.json` sets `treatWarningsAsErrors` alongside
`validation.notDocumented`, so an undocumented export or a broken cross-reference fails `npm run build:docs`.

## Documentation

See [`docs/`](docs/README.md), or the generated API reference at <https://bayudwiyansatria.github.io/nodejs-core>.
