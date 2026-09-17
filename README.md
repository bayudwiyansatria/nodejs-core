# @bayudwiyansatria/core

[![Build](https://github.com/bayudwiyansatria/nodejs-core/actions/workflows/main.yml/badge.svg?branch=master)](https://github.com/bayudwiyansatria/nodejs-core/actions/workflows/main.yml)
[![Coverage](https://codecov.io/gh/bayudwiyansatria/nodejs-core/graph/badge.svg?token=V029T8Yx6X)](https://codecov.io/gh/bayudwiyansatria/nodejs-core)
[![License](https://img.shields.io/github/license/bayudwiyansatria/nodejs-core)](LICENSE)
[![Version](https://img.shields.io/github/package-json/v/bayudwiyansatria/nodejs-core)](package.json)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white)](https://nodejs.org/)

A vendor-neutral TypeScript foundation for Node.js services. It provides capability contracts, configuration resolution,
structured logging, bounded retries, security helpers, and consistent service responses without coupling business logic
to a cloud provider, framework, or runtime.

- **Portable by design:** applications depend on capability interfaces while separate adapters provide implementations.
- **Zero runtime dependencies:** the published package does not introduce third-party runtime code.
- **Multiple module formats:** distributed as ESM, CommonJS, UMD, and TypeScript declarations.
- **Stable service primitives:** shared configuration, logging, response, resilience, and security conventions.

[API reference](https://bayudwiyansatria.github.io/nodejs-core) · [Developer documentation](docs/README.md) ·
[Changelog](CHANGELOG.md) · [Contributing](CONTRIBUTING.md)

## Contents

- [Installation](#installation)
- [Quick start](#quick-start)
- [Core concepts](#core-concepts)
- [Public API](#public-api)
- [Architecture](#architecture)
- [Development](#development)
- [Community and support](#community-and-support)

## Installation

The package is published to GitHub Packages. Authenticate with a GitHub personal access token that has the
`read:packages` permission:

```bash
npm login --scope=@bayudwiyansatria --auth-type=legacy --registry=https://npm.pkg.github.com
```

Configure the package scope in the consuming project's `.npmrc`:

```text
@bayudwiyansatria:registry=https://npm.pkg.github.com
```

Then install the package:

```bash
npm install @bayudwiyansatria/core
```

> [!IMPORTANT] Never commit a personal access token. Supply registry credentials through your local npm configuration or
> a CI secret such as `NPM_AUTH_TOKEN`.

## Quick start

Configure the shared settings once during application startup, then create a structured logger:

```ts
import { configure, Logger, systemDefaults } from '@bayudwiyansatria/core'

configure(systemDefaults)

const logger = Logger.fromEnv(
  {
    LOG_LEVEL: 'info',
    SERVICE_NAME: 'article-api'
  },
  { component: 'ArticleService' }
)

logger.info('service.started')
```

Applications using a platform adapter can combine its defaults with the system defaults:

```ts
import { configure, systemDefaults } from '@bayudwiyansatria/core'
import { platformDefaults } from '<adapter-package>'

configure({ ...systemDefaults, ...platformDefaults }, overrides)
```

## Core concepts

### Configuration

`configure()` registers defaults and optional overrides. `resolve()` reads the resulting settings from anywhere in the
application:

```ts
import { configure, resolve, systemDefaults } from '@bayudwiyansatria/core'
import type { LoggingSettings } from '@bayudwiyansatria/core'

configure(systemDefaults, {
  logging: { service: 'article-api' }
})

const logging = resolve<LoggingSettings>('logging')
```

Overrides merge by field, so partial overrides retain unspecified defaults. Fields set to `undefined` are ignored. Call
`configure()` before resolving settings, and avoid calling `resolve()` at module scope in adapters. See the
[configuration guide](docs/reference/configuration.md) for initialization order, merge behavior, and troubleshooting.

### Structured logging

`Logger` writes flat JSON lines suitable for log aggregation and indexing:

```ts
const logger = Logger.fromEnv(process.env, { component: 'ArticleService' })

logger.info('article.created', { id: 42 })
logger.error('external_api.failed', { status: 502 }, 'Upstream service returned an error')

const requestLogger = logger.child({ requestId: 'req-123' })
```

Each log call separates the stable event name, structured data, and human-readable message. Ambient context fields can
be selected with `LOG_FIELDS`:

```bash
LOG_FIELDS="requestId,method,path" # selected fields
LOG_FIELDS="*"                     # all fields (default)
LOG_FIELDS=""                      # no ambient context fields
```

### Capability contracts

Applications program against small, runtime-neutral interfaces. Adapter packages bind those interfaces to concrete
infrastructure.

| Interface               | Responsibility              |
| ----------------------- | --------------------------- |
| `CacheStore`            | Key/value caching           |
| `CoordinationStore`     | Locks and coordination      |
| `DataStore`             | Document or record storage  |
| `InferenceEngine`       | Model inference             |
| `MessageQueue`          | Message publishing/handling |
| `ObjectStore`           | Object and blob storage     |
| `RateLimiter`           | Request throttling          |
| `SqlConnectionProvider` | Relational connections      |
| `TelemetrySink`         | Metrics and request facts   |
| `VectorIndex`           | Vector search               |

No-op implementations are available for cache, messaging, rate limiting, and telemetry. They are useful in tests and in
deployments where those capabilities are intentionally disabled.

### Consistent service responses

Extend `Service` to return the same `APIResponse` shape across service methods:

```ts
import { Service } from '@bayudwiyansatria/core'
import type { APIResponse } from '@bayudwiyansatria/core'

export class ProfileService extends Service {
  public async get(id: string): Promise<APIResponse> {
    const profile = await this.repository.find(id)

    return profile ? this.ok('Profile found', profile) : this.fail('Profile not found')
  }
}
```

Use `fail()` for expected negative outcomes that callers can act on. Throw errors for unexpected faults so application
error handling can surface them appropriately.

### Bounded retries

`Retry.run()` retries transient failures with exponential backoff. The default budget comes from `delivery.retries` and
`delivery.retryBackoffMs`:

```ts
import { Retry } from '@bayudwiyansatria/core'

const rates = await Retry.run(() => client.rates(), {
  logger,
  event: 'rates.retry'
})
```

The built-in policy retries rate limits, selected server errors, and network failures. Abort and timeout errors are not
retried. Only retry operations that are safe to repeat; callers can provide `isRetryable` for domain-specific rules.

### Security and utilities

The package includes focused helpers for common service concerns:

```ts
import { Json, List, redact, Signature, Text, Time, timingSafeEqual } from '@bayudwiyansatria/core'
```

| Export            | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `redact`          | Remove credential-like fields before logging data  |
| `timingSafeEqual` | Compare strings without leaking timing information |
| `Signature`       | Create and verify HMAC-SHA-256 signatures          |
| `Json`            | Parse untrusted JSON without throwing              |
| `List`            | Split lists into bounded chunks                    |
| `Text`            | Trim, truncate, and test blank strings             |
| `Time`            | Read timestamps and calculate elapsed time         |

## Public API

Everything exported from [`src/index.ts`](src/index.ts) is public API.

| Category      | Main exports                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------- |
| Services      | `Service`, `APIResponse`                                                                     |
| Capabilities  | `Capability`, ten capability interfaces, four no-op implementations                          |
| Configuration | `configure`, `resolve`, `systemDefaults`, `SystemConfiguration`, `Overrides`, settings types |
| Observability | `Logger`, `LogFields`, `LogContext`, `LogLevel`, `LoggingSettings`                           |
| Resilience    | `Retry`, `RetryOptions`                                                                      |
| Security      | `redact`, `timingSafeEqual`                                                                  |
| Errors        | `ConfigurationError`, `MissingCapabilityError`                                               |
| Utilities     | `Json`, `List`, `Signature`, `Text`, `Time`                                                  |

For signatures and detailed behavior, visit the
[generated API reference](https://bayudwiyansatria.github.io/nodejs-core).

## Architecture

This package is the innermost layer of a service architecture. It deliberately does not depend on vendor SDKs, web
frameworks, or platform-specific runtime types.

```text
Application and business logic
            |
            v
  @bayudwiyansatria/core       capability contracts and shared primitives
            ^
            |
     Adapter packages          vendor and runtime implementations
```

The source tree reinforces that boundary:

```text
src/
  core/         Configuration, logging, services, retries, and no-op capabilities
  types/        Public contracts and configuration shapes
  constants/    Runtime-neutral defaults
  exceptions/   Public error classes
  security/     Security-oriented helpers
  utils/        Pure, vendor-neutral utilities
  index.ts      Public API barrel
```

`types/`, `constants/`, `exceptions/`, `security/`, and `utils/` are leaf layers and cannot import from `core/`. ESLint
enforces this dependency direction and the vendor-neutral boundary.

Adapter packages must keep `@bayudwiyansatria/core` external rather than bundling it. Configuration uses module state,
and loading a second embedded copy would create a separate registry and break error class identity.

## Development

Development and CI use Node.js 22.

```bash
git clone https://github.com/bayudwiyansatria/nodejs-core.git
cd nodejs-core
npm ci
npm test
npm run build
```

Common commands:

| Command                   | Purpose                                             |
| ------------------------- | --------------------------------------------------- |
| `npm test`                | Run ESLint and Jest with coverage                   |
| `npm run test:run`        | Run Jest with coverage                              |
| `npm run lint:run`        | Check source files with ESLint                      |
| `npm run format`          | Format source, tests, configuration, and Markdown   |
| `npm run build`           | Build ESM, CommonJS, UMD, and declaration artifacts |
| `npm run build:docs`      | Generate the TypeDoc API reference                  |
| `npm run build:docs:book` | Generate the HonKit developer guide                 |
| `npm run build:static`    | Build documentation, coverage, and the landing page |

Generated `lib/` and `dist/` output is intentionally not committed.

## Documentation

- [Developer documentation](docs/README.md)
- [Configuration reference](docs/reference/configuration.md)
- [Latest release notes](docs/release-notes/1.3.0.md)
- [Latest engineering changes log](docs/changes-log/2026-09-17.md)
- [Generated API reference](https://bayudwiyansatria.github.io/nodejs-core)
- [Changelog](CHANGELOG.md)

The static documentation site combines the TypeDoc API reference, HonKit developer guide, and Jest coverage report.
Build it locally with `npm run build:static` or serve it through Docker with `npm run docker:serve:docs`.

## Community and support

Contributions are welcome. Before opening a pull request, read the [contributing guide](CONTRIBUTING.md) and
[Code of Conduct](CODE_OF_CONDUCT.md).

- Use [GitHub Issues](https://github.com/bayudwiyansatria/nodejs-core/issues) for reproducible bugs and focused feature
  proposals.
- Follow the [support guide](SUPPORT.md) for usage questions.
- Report vulnerabilities privately according to the [security policy](SECURITY.md).

This project follows [Semantic Versioning](https://semver.org/).

## License

Licensed under the [MIT License](LICENSE).
