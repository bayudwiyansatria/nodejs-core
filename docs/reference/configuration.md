# Configuration

Call `configure()` during application startup, then read settings through `resolve()`.

## Registering settings

```
configure(defaults, overrides)   ← the application calls this, once, at startup
        │
        ▼
  the registry                    ← module state inside this package
        │
        ▼
resolve<S>('cache')               ← everything downstream reads this
```

The application combines this package's runtime-neutral `systemDefaults` with an adapter's platform defaults and any
application overrides:

```ts
import { configure, systemDefaults } from '@bayudwiyansatria/core'
import { platformDefaults } from '<the-adapter-package>'

configure({ ...systemDefaults, ...platformDefaults }, overrides)
```

This package owns `delivery`, `logging`, and `security`. Adapters supply separate modules for platform resources. Keep
those module names distinct when combining defaults with object spread.

## Reading a setting

```ts
const { level, service } = resolve<LoggingSettings>('logging')
```

The type argument declares the expected shape; it does not validate the registered settings. The application must
register a compatible value. Callers receive the resolved settings without needing to distinguish defaults from
overrides.

## Merge semantics

Overrides replace individual top-level fields within a module:

```ts
configure({ cache: { driver: 'memory', ttl: 300 } }, { cache: { ttl: 60 } })

resolve('cache') // { driver: 'memory', ttl: 60 }
```

Overriding `ttl` keeps the default `driver`. Fields set to `undefined` are ignored. Nested objects are replaced as field
values; they are not recursively merged.

Modules the overrides do not mention are untouched, and `configure()` never mutates the objects it is given.

Calling `configure()` again replaces all registered defaults and overrides. Tests can use this to install a fresh
fixture.

## The ordering rule

**`configure()` must run before anything resolves a setting.**

Static imports evaluate their dependencies before statements in the importing module run:

```ts
import { configure } from '@bayudwiyansatria/core'
import { CacheService } from '<the-adapter-package>'

configure(...) // dependencies have already evaluated
```

**For adapter authors:** defer resolution until first use. A module-level accessor or its constructor must not resolve
settings before the application has configured them. A memoised getter can resolve settings when they are first needed.

**For application authors:** put `configure()` in a configuration module. Modules that read settings during
initialization must import it before reading those settings:

```ts
// src/config/index.ts
configure(defaults, overrides)
```

```ts
// src/app.ts
import './config' // must come first
```

Keep initialization dependencies explicit and avoid cycles. Route and middleware registration can read settings during
startup, so configuration must already be registered at that point.

## When it goes wrong

`resolve()` throws `ConfigurationError` when a module is registered in neither the defaults nor the overrides. Check the
requested module name and these common causes:

- **`configure()` has not run** — check initialization order.
- **Two copies of this package are loaded** — the registry is module state, so a second copy means `configure()` seeds
  one registry while `resolve()` reads the other, and every lookup misses. This is what happens when a bundler inlines
  the kernel into an adapter package instead of leaving it external.

Adapters must keep this package external in their bundles so they share the application's registry.

## Adding a setting

1. Add the field to the relevant `*Settings` interface.
2. Give it a default in `systemDefaults`, or in the adapter's defaults if a platform resource settles it.
3. Read it through `resolve()`.

An application overrides it without either package changing.
