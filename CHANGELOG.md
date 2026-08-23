# CHANGELOG

All notable changes to this project will be documented in this file.

See detailed changes in [docs/changes-log/](docs/changes-log/) for each work session, and
[docs/release-notes/](docs/release-notes/) for each release.

## [Unreleased]

### Changed

- **Release notes rewritten to the family's section skeleton** — `# Release Notes` / `## Version <x.y.z>` with the
  emoji sections, adopted from `@bayudwiyansatria/auth-client`. Documentation only; no prose was cut and no source,
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

First release of `@bayudwiyansatria/core`, the vendor-neutral kernel. The code previously lived inside an application
as `src/core/system/`; this repository previously held the Node.js library template, whose scaffolding was replaced and
whose placeholder source was removed.

### Added

- **Capabilities** — `Capability` and the ten interfaces over it (`CacheStore`, `CoordinationStore`, `DataStore`,
  `InferenceEngine`, `MessageQueue`, `ObjectStore`, `RateLimiter`, `SqlConnectionProvider`, `TelemetrySink`,
  `VectorIndex`), plus `RequestMetadata` and the shapes their calls exchange
- **Configuration** — `configure`, `resolve`, `systemDefaults`, and the settings shapes. `configure()` is new: it
  replaces `resolve()`'s import of the application's own `src/config/`, which a package cannot reach across its
  boundary
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
- `Signature` derives its key type from `crypto.subtle` rather than the ambient `CryptoKey`, which is only global when
  a runtime-specific lib is in scope

### Notes

- The `exports` map exposes `.` and `./package.json` only. There are no deep import paths, so the `src/` layout is not
  part of the public contract
- 85 specs across nine suites; statement coverage 99.45%

See [docs/release-notes/1.0.0.md](docs/release-notes/1.0.0.md) for full release details.
