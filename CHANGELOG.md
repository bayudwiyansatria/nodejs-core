# CHANGELOG

All notable changes to this project will be documented in this file.

See detailed changes in [docs/changes-log/](docs/changes-log/) for each work session, and
[docs/release-notes/](docs/release-notes/) for each release.

## [1.2.1] - 2026-08-24

What 330 production log records showed about the lines 1.2.0 produces: half of every line was a field paid for twice,
and the one column a person reads was blank. See the [release notes](docs/release-notes/1.2.1.md).

### Breaking Changes

- **The payload is flattened onto the line.** `logger.info('article.created', { id: 7 })` emits `{ …, "id": 7 }` rather
  than `{ …, "data": { "id": 7 } }`. A collector indexes `id`, not `data.id`, so a dashboard column is named for what it
  holds instead of for a nesting level. No call site changes; anything reading `data.x` reads `x`
- **Every line carries a `message`** alongside its `event`, defaulting to the event name when no sentence is given. They
  are different things and both belong: `event` is what a query filters on, `message` is the column most log viewers
  show by default
- **Context fields pass an allow-list.** The kernel default admits everything, so nothing disappears on its own — but a
  `logging.fields` on the configuration surface or a `LOG_FIELDS` in the environment drops what it does not name,
  `service` and `time` included

### Added

- **`LogFields`** — resolves which context fields reach the line, from `LOG_FIELDS` in the environment first,
  `logging.fields` on the surface second, and `*` last. `*` admits every field; an empty declaration admits none, which
  is not the same as leaving it unset. The kernel narrows nothing by itself, because knowing which fields a runtime
  already records is an adapter's knowledge
- **`LoggingSettings.fields`** — the surface-level form of the same declaration, and where an adapter states it
- **An optional third argument on `debug`, `info`, `warn` and `error`** — a sentence for whoever reads the stream.
  Existing call sites are unaffected and fall back to the event name

### Fixed

- **`redact` no longer masks booleans.** Every field on a production `authentication.failed` line came back
  `[redacted]`, including the four booleans that said why it failed — a line that recorded a failure and withheld its
  cause. A boolean cannot carry a credential, so booleans pass; `cardNumber`, `cvv`, `cvc`, `pinCode`, `otp` and `iban`
  are exempt from that and mask whatever type they arrive as

## [1.2.0] - 2026-08-23

Three changes to `Logger`, all consequences of one observation: the runtimes this kernel is deployed on already know
things it was restating. See the [release notes](docs/release-notes/1.2.0.md).

### Breaking Changes

- **Lines carry `event` where they carried `message`**, and the value is a dotted event name rather than a sentence. The
  method signatures are unchanged, so nothing stops compiling; what changes is the field a query filters on. A collector
  that indexes JSON fields turns `event` into a column, which makes `event = notification.failed` a filter and the count
  of one event a series — neither of which a prose message can be
- **The service name comes from `SERVICE_NAME` in the environment**, ahead of `logging.service` on the configuration
  surface. A name in the environment sits beside the deployment's own name, where a rename that misses it shows up in
  the same diff; a constant compiled in from `config/` sits in a file a rename does not touch, which is how a Worker
  spent production calling itself `cloudflare-boilerplate`. `LoggingSettings.service` is now optional and
  `systemDefaults` supplies none, so code reading it reads `string | undefined`
- **A line with no name available reads `service: "unknown"`** rather than omitting the field, so a forgotten
  `SERVICE_NAME` is a query result rather than an invisible gap

### Added

- **`redact`** — scrubs credential-named fields out of a structure bound for a log stream, matching on field names
  separator- and case-insensitively, walking arrays and nested objects to a bounded depth, and returning `Error` values
  untouched. In `security/` rather than `utils/` on the same intent test as `timingSafeEqual`: it exists because the
  obvious alternative is unsafe
- **`LogContext.component`** — which part of an application wrote a line, where `service` says which service. Call sites
  previously overwrote `service` with a class name, so the field meant two different things depending on the line

### Changed

- **`Logger` runs every payload through `redact`** before serialising. Redaction first, then `Error` expansion — the
  order matters, because redaction leaves errors alone precisely so the second pass can recognise them

## [Unreleased]

### Changed

- **Release notes rewritten to the family's section skeleton** — `# Release Notes` / `## Version <x.y.z>` with the emoji
  sections, adopted from `@bayudwiyansatria/auth-client`. Documentation only; no prose was cut and no source,
  configuration, or exported symbol changed
- **The `1.1.0` section of this file, previously missing**, written up from `docs/release-notes/1.1.0.md` and
  `docs/changes-log/2026-08-08.md`

## [1.1.0] - 2026-08-08

One addition. An application can now say how hard it tries when it posts to a service it does not control, through the
same `configure`/`resolve` path every other setting travels.

### Breaking Changes

- **`SystemConfiguration` gains a required member**, `delivery`. Anything constructing that surface by hand rather than
  spreading `systemDefaults` will stop type-checking until it supplies one. The spread form — what the boilerplate and
  every service forked from it does — is unaffected, which is why this lands as a minor

### Added

- **`DeliverySettings`** — `timeoutMs`, `retries`, `retryBackoffMs`, and `userAgent`, describing how an outbound request
  behaves. It belongs in the kernel by the same test everything else here passes: it names no vendor, no runtime, and no
  HTTP framework
- **`SystemConfiguration.delivery`** and **`systemDefaults.delivery`** — ten seconds an attempt, two retries, a backoff
  doubling from 250 ms, and a deliberately generic `'app'` as the user agent, matching the placeholder discipline
  `logging.service` follows

The entry point now publishes 43 names, up from 42. The `exports` map is unchanged.

### Notes

- **Nothing in this package reads it.** This package publishes the shape and the default; the application that actually
  posts is where the policy gets applied. Adding a delivery client here would mean shipping an HTTP client from a
  package whose whole premise is that it ships none
- Runtime behaviour is unchanged. No existing field moved, no default was re-tuned, and nothing new is read at startup
- 85 specs across nine suites, unchanged from 1.0.0 — the honest outcome for a release that adds a type and an object
  literal

See [docs/release-notes/1.1.0.md](docs/release-notes/1.1.0.md) for full release details.

## [1.0.0] - 2026-08-07

First release of `@bayudwiyansatria/core`, the vendor-neutral kernel. The code previously lived inside an application as
`src/core/system/`; this repository previously held the Node.js library template, whose scaffolding was replaced and
whose placeholder source was removed.

### Added

- **Capabilities** — `Capability` and the ten interfaces over it (`CacheStore`, `CoordinationStore`, `DataStore`,
  `InferenceEngine`, `MessageQueue`, `ObjectStore`, `RateLimiter`, `SqlConnectionProvider`, `TelemetrySink`,
  `VectorIndex`), plus `RequestMetadata` and the shapes their calls exchange
- **Configuration** — `configure`, `resolve`, `systemDefaults`, and the settings shapes. `configure()` is new: it
  replaces `resolve()`'s import of the application's own `src/config/`, which a package cannot reach across its boundary
- **Contracts** — `Service` and the `APIResponse` envelope its `ok()` / `fail()` builders produce
- **No-op implementations** — `NoopCacheStore`, `NoopMessageQueue`, `NoopRateLimiter`, `NoopTelemetrySink`, each
  degrading exactly as its interface documents
- **Observability** — `Logger`, `LogContext`, and the `LOG_LEVEL` environment override
- **Security and utilities** — `timingSafeEqual`, `Signature`, `Text`, `Time`
- **Errors** — `MissingCapabilityError` and `ConfigurationError`
- **Kernel-purity ESLint rule** — no `@cloudflare/*`, `hono`, or `cloudflare:*` anywhere in `src/`, plus a leaf-layer
  rule keeping `types/`, `constants/`, `exceptions/`, `security/`, and `utils/` free of `core/`

### Changed

- `Logger.fromEnv` takes `{ LOG_LEVEL?: string } | null | undefined` rather than a platform-specific `Env` — the only
  real reference to a runtime type in the package
- `resolve()` is generic over the settings shape (`resolve<CacheSettings>('cache')`), since the kernel cannot know the
  assembled surface
- `systemDefaults.logging.service` is `'app'` rather than the name of the application this came from
- `Signature` derives its key type from `crypto.subtle` rather than the ambient `CryptoKey`, which is only global when a
  runtime-specific lib is in scope

### Notes

- The `exports` map exposes `.` and `./package.json` only. There are no deep import paths, so the `src/` layout is not
  part of the public contract
- 85 specs across nine suites; statement coverage 99.45%

See [docs/release-notes/1.0.0.md](docs/release-notes/1.0.0.md) for full release details.
