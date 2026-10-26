# Contributing

Thank you for contributing to `@bayudwiyansatria/core`.

Before opening a pull request, review [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md), and this
guide.

## Ways to Contribute

- Report reproducible bugs through the bug-report template.
- Propose focused features with a clear use case.
- Improve documentation, tests, accessibility, or developer tooling.
- Submit fixes that preserve the package's vendor-neutral public API.

For usage questions, follow [SUPPORT.md](SUPPORT.md). Report vulnerabilities privately as described in
[SECURITY.md](SECURITY.md).

## Prerequisites

- Node.js 22
- npm
- Git

## Development Setup

1. Fork and clone the repository.
2. Create a focused branch such as `feature/short-description` or `hotfix/short-description`.
3. Install the locked dependency set with `npm ci`.
4. Run `npm test` and `npm run build`.

Useful commands:

```bash
npm test                 # formatting, lint, and Jest tests
npm run build            # CommonJS, ESM, UMD, and declarations
npm run build:docs       # TypeDoc API reference
npm run build:docs:book  # HonKit developer documentation
npm run format           # format source, tests, docs, and configuration
npm run format:check     # check formatting without changing files
npm run lint:fix         # fix supported lint issues in source and tests
```

## Code and Documentation Style

- Use TypeScript for implementation code.
- Use two-space indentation, single quotes, no semicolons, and a 120-character print width.
- Separate declarations, validation, work, and returns with useful blank lines.
- Group test setup, actions, and assertions so each case reads in order.
- Write one idea per paragraph and explain constraints without repeating the code.
- Keep `types/`, `constants/`, `exceptions/`, `security/`, and `utils/` independent of `core/`.
- Keep runtime, vendor, and framework-specific behavior in adapter packages.
- Add JSDoc to every public export; TypeDoc treats missing documentation and invalid links as errors.
- Put Jest specs in `test/` and use the `*.spec.ts` suffix.
- Update the README and reference documentation when public behavior changes.

The [readability guide](docs/reference/readability.md) includes examples and the checks used during review.

## Branch and Commit Guidelines

- Keep each branch and pull request focused on one concern.
- Write small, descriptive commits.
- Do not commit generated `lib/` or `dist/` output.
- Rebase or merge the target branch before requesting final review when necessary.

## Pull Request Process

1. Explain the problem, the solution, and any compatibility impact.
2. Link related issues with `Closes #123` or `Relates to #123`.
3. Add or update tests for behavior changes.
4. Update `README.md`, API documentation, and reference documentation when needed.
5. Add or update the dated entry in `docs/changes-log/` for notable changes.
6. Add user-visible changes under `[Unreleased]` in `CHANGELOG.md`.
7. Run `npm test`, `npm run build`, and `npm run build:docs` before requesting review.

Maintainers may request changes when a contribution introduces runtime-specific behavior, expands the public API without
a demonstrated shared use case, or lacks suitable tests and documentation.

## Versioning

This project follows [Semantic Versioning](https://semver.org/).

Maintainers assign versions and publish releases. Contributors should document compatibility impact but should not
change the package version unless asked.
