# Core

[![Main](https://github.com/bayudwiyansatria/nodejs-core/actions/workflows/main.yml/badge.svg?branch=master)](https://github.com/bayudwiyansatria/nodejs-core/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/bayudwiyansatria/nodejs-core/graph/badge.svg?token=V029T8Yx6X)](https://codecov.io/gh/bayudwiyansatria/nodejs-core)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.1%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)
[![License](https://img.shields.io/github/license/bayudwiyansatria/nodejs-core)](LICENSE)
[![Version](https://img.shields.io/github/package-json/v/bayudwiyansatria/nodejs-core)](package.json)

The vendor-neutral kernel shared by my Node/TypeScript services: capability interfaces, configuration resolution,
structured logging, and the service response contract.

## Overview

This package is the bottom layer everything else depends on. It provides four things: interfaces describing what an
application needs from its platform, a configuration engine that merges defaults with overrides, a structured logger,
and an abstract `Service` base that fixes the response shape.

It has no runtime dependencies and names no vendor, no runtime, and no HTTP framework. A cache is described by the
`CacheStore` interface; which cache you actually get is decided by a separate adapter package. Applications import the
interface, adapters implement it, and business logic written against `CacheStore` moves between platforms unchanged.

Published to the GitHub npm registry as `@bayudwiyansatria/core`, built by Rollup into CommonJS, ESM, UMD, and type
declaration artifacts under `lib/`.

## Included in This Package

| Category      | Exports                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------- |
| Contracts     | `Service`, `APIResponse`                                                                     |
| Capabilities  | `Capability` plus ten interfaces over it, and four `Noop*` implementations                   |
| Configuration | `configure`, `resolve`, `systemDefaults`, `SystemConfiguration`, `Overrides`, settings types |
| Observability | `Logger`, `LogContext`, `LogLevel`, `LoggingSettings`                                        |
| Security      | `timingSafeEqual`                                                                            |
| Errors        | `MissingCapabilityError`, `ConfigurationError`                                               |
| Utilities     | `Signature`, `Text`, `Time`                                                                  |

Tooling and project baseline:

- TypeScript setup with `@/*` path aliases (`tsconfig*.json`)
- Rollup build producing four artifacts in `lib/`
- Jest with coverage output to `dist/coverage`, reported to Codecov
- ESLint and Prettier, including the layering and vendor-neutrality rules
- TypeDoc API reference to `dist/docs`, with undocumented exports treated as build failures
- HonKit developer book to `dist/book`, with a custom dark theme
- Docker docs site with an nginx landing page
- Community standards files (Contributing, Code of Conduct, Security, Support)
- Changelog, release notes, and changes-log structure

## Install

```bash
npm install @bayudwiyansatria/core
```

The package publishes to the GitHub npm registry, so `.npmrc` needs:

```
@bayudwiyansatria:registry=https://npm.pkg.github.com
```

## Quick Start

```ts
import { configure, Logger, systemDefaults } from '@bayudwiyansatria/core'
import { platformDefaults } from '<the-adapter-package>'

// Once, at startup, before anything reads a setting.
configure({ ...systemDefaults, ...platformDefaults }, { logging: { service: 'article-api' } })

const log = Logger.fromEnv(env, { service: 'ArticleService' })
log.info('ready')
```

## Usage

### Configuration

Call `configure()` once at startup, then read settings anywhere with `resolve()`.

```ts
import { configure, resolve, systemDefaults } from '@bayudwiyansatria/core'
import type { LoggingSettings } from '@bayudwiyansatria/core'

configure(systemDefaults, { logging: { service: 'article-api' } })

const logging = resolve<LoggingSettings>('logging')
// { level: 'info', service: 'article-api' }
```

Overrides merge per field, not per module. The example above changes `service` and keeps the default `level`. A field
set to `undefined` is ignored rather than treated as a blank.

`resolve()` throws a `ConfigurationError` when a module is in neither the defaults nor the overrides. In practice that
means either `configure()` has not run yet, or two copies of this package are loaded. See
[Notes for Adapters](#notes-for-adapters).

### Logging

`Logger` writes structured JSON lines. `fromEnv` reads `LOG_LEVEL` off the environment object you hand it and falls back
to the configured level. Levels are `debug`, `info`, `warn`, `error`.

```ts
import { Logger } from '@bayudwiyansatria/core'

const log = Logger.fromEnv(env, { service: 'ArticleService' })

log.info('article created', { id: 42 })
log.error('upstream failed', { status: 502 })

const scoped = log.child({ requestId }) // inherits context, adds its own
```

### Services

`Service` is an abstract base giving you `ok()` and `fail()`, so every service returns the same `APIResponse` shape.

```ts
import { Service } from '@bayudwiyansatria/core'
import type { APIResponse } from '@bayudwiyansatria/core'

export class ProfileService extends Service {
  public async get(id: string): Promise<APIResponse> {
    const profile = await this.repository.find(id)

    return profile ? this.ok('profile found', profile) : this.fail('no profile with that id')
  }
}
```

Use `fail()` for outcomes the caller asked for and did not get, like a missing row. Throw for faults the caller cannot
act on, so they surface as a 500 instead of a well-formed `false`.

### Capabilities

Ten interfaces describe what an application needs from its platform. Each extends `Capability` and is generic over the
runtime type an adapter binds to.

| Interface               | Covers                    |
| ----------------------- | ------------------------- |
| `CacheStore`            | key/value cache           |
| `CoordinationStore`     | locks and coordination    |
| `DataStore`             | document/record storage   |
| `InferenceEngine`       | model inference           |
| `MessageQueue`          | publish and consume       |
| `ObjectStore`           | blob storage              |
| `RateLimiter`           | request throttling        |
| `SqlConnectionProvider` | relational connections    |
| `TelemetrySink`         | metrics and request facts |
| `VectorIndex`           | vector search             |

`NoopCacheStore`, `NoopMessageQueue`, `NoopRateLimiter`, and `NoopTelemetrySink` satisfy their interface without doing
anything, which is useful in tests and in deployments where the capability is not wired up.

### Utilities

- `Signature.sign(secret, scope, value)` and `Signature.verify(...)` for stateless tokens over HMAC-SHA-256
- `Text.truncate`, `Text.trim`, `Text.isBlank`
- `Time.now`, `Time.nowIso`, `Time.since`
- `timingSafeEqual(a, b)` for constant-time string comparison

## Project Structure

```text
src/
  index.ts              Public API barrel, the entire published surface
  core/                 Service, Logger, configure, resolve, ConfigurationRegistry
    noop/               No-op capability implementations
  types/                Shapes callers receive or supply
    capabilities/       The capability interfaces and their supporting shapes
  constants/            systemDefaults
  exceptions/           MissingCapabilityError, ConfigurationError
  security/             timingSafeEqual
  utils/                Signature, Text, Time
test/                   Jest specs (*.spec.ts) mirroring src/
docs/                   Documentation and release history
  reference/            Reference guides
  styles/               Custom CSS for the HonKit book theme
  book.json             HonKit configuration
  SUMMARY.md            Book table of contents
  changes-log/          Per-date change logs
  release-notes/        Per-version release notes
docker/                 Docker assets for the docs site
  nginx/                Nginx config and landing page
  docs.Dockerfile       Multi-stage build for the docs site
  docker-compose.docs.yaml
eslint.config.ts        Layering and vendor-neutrality rules
rollup.config.ts        Build pipeline for the four lib/ artifacts
CHANGELOG.md            Top-level changelog
CONTRIBUTING.md         Contribution workflow
SECURITY.md             Security policy
SUPPORT.md              Support channels
```

### Layering

`types/`, `constants/`, `exceptions/`, `security/`, and `utils/` are leaf layers: they import nothing else from `src/`.
Only `core/` and `index.ts` import across layers. Keeping the leaves free of the config engine and the logger is what
lets them be read, tested, or moved elsewhere on their own.

A `no-restricted-imports` rule in [`eslint.config.ts`](eslint.config.ts) enforces it, so this fails `npm run lint`:

```ts
// src/utils/Text.ts
import { resolve } from '@/core'
```

If a leaf genuinely needs something from `core/`, take it as an argument or move the shared piece down into a leaf.

`security/` is separate from `utils/` on intent rather than size. `timingSafeEqual` exists because the obvious
alternative is unsafe. JWT and PKI helpers would go there too.

## Available Scripts

- `npm run build` Build the four `lib/` artifacts via Rollup
- `npm run dev` Rollup in watch mode
- `npm test` Run lint and tests
- `npm run test:run` Run Jest with coverage
- `npm run lint:run` Run ESLint over `src`
- `npm run lint:fix` Run ESLint with auto-fix
- `npm run format` Run Prettier over config, `src`, and `test`
- `npm run build:docs` Generate the TypeDoc API reference into `dist/docs`
- `npm run build:docs:book` Build the HonKit developer book into `dist/book`
- `npm run build:docs:coverage` Produce the coverage report into `dist/coverage`
- `npm run build:static` Build every static artifact into `dist/` (`index.html`, `docs/`, `book/`, `coverage/`)
- `npm run build:all` Build the library and the static site
- `npm run docker:build:docs` Build the docs site image
- `npm run docker:serve:docs` Serve the docs site with Docker Compose

## Notes for Adapters

If code here looks like it needs a vendor SDK, a runtime's types, or an HTTP framework, it belongs in an adapter package
instead. An ESLint rule enforces this.

Adapters must treat this package as an external dependency, not bundle it. The configuration registry is module state
and `MissingCapabilityError` is a class identity, so a second inlined copy breaks both quietly: `configure()` seeds one
registry while the adapter reads the other, and `instanceof` stops matching. Assert this against your built bundles
rather than trusting the bundler config.

## Development

```bash
npm install
npm test           # lint + jest
npm run build      # four artifacts under lib/
npm run build:docs
```

`typedoc.json` sets `treatWarningsAsErrors` and `validation.notDocumented`, so an undocumented export or a broken
cross-reference fails `npm run build:docs`.

CI runs on push to `master`
([Main](https://github.com/bayudwiyansatria/nodejs-core/blob/master/.github/workflows/main.yml)) and on `feature/**` and
`hotfix/**` branches
([Features](https://github.com/bayudwiyansatria/nodejs-core/blob/master/.github/workflows/features.yml)). Releases are
cut manually through the Release Dispatch workflow.

## Documentation

- [Docs Home](docs/README.md)
- [Summary](docs/SUMMARY.md)
- [Configuration Reference](docs/reference/configuration.md) — `configure`, `resolve`, merge semantics, and the ordering
  constraint
- [Latest Release Notes](docs/release-notes/1.0.0.md)
- [Changes Log](docs/changes-log/2026-08-07.md)
- [API Reference](https://bayudwiyansatria.github.io/nodejs-core) — generated from source

### Docs Site

The docs site combines three artifacts behind an nginx landing page:

- **API Docs** TypeDoc reference at `dist/docs`
- **Coverage Report** Jest HTML report at `dist/coverage`
- **Developer Book** HonKit guide at `dist/book`, with dark theme and full-text search

Build them locally:

```bash
npm run build:static
```

Or serve the whole site with Docker:

```bash
npm run docker:serve:docs
```

Then open `http://localhost` for the landing page, which links to the docs, the coverage report, and the book.

## Contributing and Governance

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Support Guide](SUPPORT.md)
- [Changelog](CHANGELOG.md)

## Authors

- [Bayu Dwiyan Satria](https://github.com/bayudwiyansatria) - Creator and Maintainer

## Acknowledgments

Thanks to the open-source community and all contributors for support and inspiration.

## License

MIT. See [LICENSE](LICENSE).
