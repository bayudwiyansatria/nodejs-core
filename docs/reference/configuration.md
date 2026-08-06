# Configuration

How settings reach the code that needs them, and the one ordering rule that governs it.

## The shape of it

```
configure(defaults, overrides)   ← the application calls this, once, at startup
        │
        ▼
  the registry                    ← module state inside this package
        │
        ▼
resolve<S>('cache')               ← everything downstream reads this
```

The surface is assembled by the **application**, because the application is the only layer allowed to know every half of
it. This package contributes `systemDefaults` — the settings that mean the same thing on any runtime — and an adapter
package contributes the platform-backed ones:

```ts
import { configure, systemDefaults } from '@bayudwiyansatria/core'
import { platformDefaults } from '<the-adapter-package>'

configure({ ...systemDefaults, ...platformDefaults }, overrides)
```

A flat merge is safe because the halves share no key: this package owns `logging` and `security`, the adapter owns the
binding-backed modules.

That inversion is what makes the kernel extractable. Before it, `resolve()` imported the application's configuration
directly — fine inside one repository, impossible across a package boundary.

## Reading a setting

```ts
const { level, service } = resolve<LoggingSettings>('logging')
```

The type argument is explicit because this package cannot know the assembled surface. The caller declares the shape it
expects, and the application is responsible for having registered something that matches.

Callers never learn whether a value came from a default or an override. They get one settled object and use it.

## Merge semantics

Resolution is **per field**, not per module:

```ts
configure({ cache: { driver: 'memory', ttl: 300 } }, { cache: { ttl: 60 } })

resolve('cache') // { driver: 'memory', ttl: 60 }
```

An override that names only `ttl` keeps the default `driver`, so a partial override never silently blanks the
rest of a module.

An override field set explicitly to `undefined` is **ignored**, for the same reason — writing `{ model: undefined }` is
how a caller says "no opinion", not "erase it".

Modules the overrides do not mention are untouched, and `configure()` never mutates the objects it is given.

Calling `configure()` again **replaces** the surface outright rather than merging into it. That keeps the semantics of a
single call obvious, and gives a test a clean way to install a fixture.

## The ordering rule

**`configure()` must run before anything resolves a setting.**

This is harder than it sounds, because ES imports are hoisted:

```ts
import { configure } from '@bayudwiyansatria/core'
import { CacheService } from '<the-adapter-package>' // evaluates that package NOW

configure(...) // runs after both modules have fully initialised
```

Nothing an application writes can make a statement run before its own imports. Two consequences:

**For adapter authors.** Never call `resolve()` at module scope or in a constructor. Adapters create accessors at module
scope so one instance is reused across requests, and if that resolved settings, the *import statement* would throw.
Defer to first use instead, with a memoised getter that calls `resolve()` the first time a setting is read.

**For application authors.** Put the `configure()` call in your configuration module and have anything that reads
settings while initialising import that module:

```ts
// src/config/index.ts
configure(defaults, overrides)
```

```ts
// src/app.ts
import 'config' // must come first
```

A module is always fully evaluated before its importers, so naming the dependency makes the module graph enforce the
order. Statement order inside one file would not survive an import being reordered.

This matters because registering routes and middleware is startup work by nature: a security middleware needs to know
which routes it protects at the moment it registers them, not per request.

## When it goes wrong

`resolve()` throws `ConfigurationError` for a module registered in neither the defaults nor the overrides. There are
only two ways to reach it, and the message names both because they present identically at the call site:

- **`configure()` has not run** — the ordering problem above.
- **Two copies of this package are loaded** — the registry is module state, so a second copy means `configure()` seeds
  one registry while `resolve()` reads the other, and every lookup misses. This is what happens when a bundler inlines
  the kernel into an adapter package instead of leaving it external.

The second is the nastier one, because nothing about the stack trace suggests a packaging problem.

Failing loudly here is deliberate. Returning `undefined` would push the fault downstream to whichever binding first
dereferenced the settings, where the message would name the cache rather than the missing `configure()` call that
actually caused it.

## Adding a setting

1. Add the field to the relevant `*Settings` interface.
2. Give it a default in `systemDefaults`, or in the adapter's defaults if a platform resource settles it.
3. Read it through `resolve()`.

An application overrides it without either package changing.
