# CHANGELOG

All notable changes to this project will be documented in this file.

See detailed changes in [docs/changes-log/](docs/changes-log/) for each release.

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
