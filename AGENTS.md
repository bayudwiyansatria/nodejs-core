# AGENTS.md — AI Agent Guide for `nodejs-core`

## Overview

This repository contains `@bayudwiyansatria/core`, a vendor-neutral TypeScript library shared by Node.js services. It
publishes capability contracts, configuration resolution, structured logging, service response helpers, security
utilities, and general-purpose utilities. Runtime- or vendor-specific implementations belong in adapter packages.

## Repository Structure

```text
src/                    TypeScript implementation
  index.ts              Public API barrel
  constants/            Runtime-neutral defaults
  core/                 Configuration, logging, services, and no-op capabilities
  exceptions/           Public error classes
  security/             Security-motivated helpers
  types/                Public contracts and configuration shapes
  utils/                Pure, vendor-neutral utilities
test/                   Jest specs mirroring src/
docs/                   Developer documentation and release history
  reference/            Living reference guides
  changes-log/          Date-based engineering records
  release-notes/        Version-based release notes
docker/                 Documentation-site image and nginx assets
```

Generated output is written to `lib/` and `dist/` and is not committed.

## Package and Module Formats

- Package type: ESM-first (`"type": "module"`)
- CommonJS: `lib/index.min.cjs`
- ESM: `lib/index.min.mjs`
- UMD: `lib/index.min.umd.cjs`
- Type declarations: `lib/index.d.ts`
- Registry: GitHub Packages (`https://npm.pkg.github.com`)
- Public entry points: `.` and `./package.json`

Rollup creates three JavaScript bundles with source maps and one declaration bundle without a source map.

## Developer Workflows

Use Node.js 22, matching CI.

```bash
npm ci
npm run build            # Build all package artifacts into lib/
npm test                 # Check formatting, lint, then run Jest with coverage
npm run test:run         # Run Jest with coverage
npm run lint:run         # Check src/ and test/ with ESLint
npm run lint:fix         # Apply safe ESLint fixes to src/ and test/
npm run format           # Format source, tests, documentation, and configuration
npm run format:check     # Check formatting without changing files
npm run build:docs       # Generate TypeDoc into dist/docs/
npm run build:docs:book  # Generate HonKit output into dist/book/
npm run build:static     # Build docs, book, coverage, and landing page
npm run dev              # Run Rollup in watch mode
```

## Code Style and TypeScript

ESLint and Prettier configuration live in `eslint.config.ts` and `.prettierrc.json`.

- No semicolons
- Single quotes
- No trailing commas
- Two-space indentation
- 120-character print width
- Keep build configuration lists expanded, with one entry per line, even when they fit on one line
- `CODEOWNERS` is a pattern file, not Markdown. Preserve ownership patterns such as `*`; never format them as list
  markers.
- Blank lines between declarations, validation, work, error handling, and returns
- Related declarations and assertions stay together; avoid a blank line after every statement
- Test setup, actions, and assertions form visible groups
- Comments explain intent or constraints; avoid repeating the code or test name
- TypeScript target and module: ES2020
- `@/*` maps to `src/*`; there is intentionally no `baseUrl`
- The build configuration is flexible, while tests use the stricter `tsconfig.test.json`

The ESLint rules enforce vendor neutrality and layer boundaries. Leaf layers (`types/`, `constants/`, `exceptions/`,
`security/`, and `utils/`) must not import from `core/`.

## Testing and Documentation

- Jest discovers `*.spec.ts` files under `test/`.
- Coverage is generated under `dist/coverage/`.
- TypeDoc reads `src/index.ts` and treats warnings, undocumented exports, and invalid links as errors.
- HonKit uses `docs/SUMMARY.md` as the developer-book table of contents.
- Release notes live in `docs/release-notes/`; dated engineering records live in `docs/changes-log/`.
- Read nearby dated records before adding a change log. Start with the concrete situation, use headings specific to the
  decisions, and explain the reasons and evidence in connected prose. Follow the existing narrative style rather than
  imposing a generic report template.
- Historical release documents should not be rewritten for current behavior except to fix links, formatting, or factual
  errors. Reference guides are living documentation.

## Deployment

The manually dispatched release workflow builds and publishes the package, creates the GitHub release, and deploys the
combined static documentation output to GitHub Pages when the repository is public. The site includes TypeDoc, HonKit,
coverage, and the nginx landing page.

## Public API Conventions

Everything exported from `src/index.ts` is public API.

- Add complete JSDoc to every new export.
- Export public types with `export type`.
- Add tests under `test/` using the `*.spec.ts` suffix.
- Update README, reference docs, changelog, and release documentation when behavior changes.
- Keep the package framework-, vendor-, and runtime-neutral.
- Do not add a utility until it is pure, vendor-neutral, and demonstrated in more than one consumer.
- Do not commit generated `lib/` or `dist/` files.

## Review and Evidence

Use source and tests to verify implementation claims. Record the checks performed and distinguish local verification
from deployed behavior. Preserve existing local changes, stable identifiers, and unresolved work. Report conflicts
before changing ownership or marking work complete.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the review workflow and
[the readability guide](docs/reference/readability.md) for code, test, and documentation examples.
