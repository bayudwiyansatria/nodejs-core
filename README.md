# Templates Project Node.js

[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.1%20adopted-ff69b4.svg)](CODE_OF_CONDUCT.md)
[![License](https://img.shields.io/github/license/bayudwiyansatria/templates-project-nodejs)](LICENSE)
[![Version](https://img.shields.io/github/package-json/v/bayudwiyansatria/templates-project-nodejs)](package.json)

A reusable Node.js library template focused on TypeScript, Rollup packaging, Jest testing, and complete repository docs.

## Overview

This repository is a starter template for publishing Node.js libraries. It is intended to be copied and adapted into a
new project by replacing package metadata, adding source files in `src/`, and updating documentation for your domain.

## Included in This Template

- TypeScript project setup (`tsconfig*.json`)
- Rollup build pipeline for distributable library outputs
- Jest test configuration
- ESLint + Prettier integration
- TypeDoc documentation generation
- Community standards files (Contributing, Code of Conduct, Security, Support)
- Changelog and release notes structure

## Project Structure

```text
src/                          Source files for your library (currently empty template)
docs/                         Documentation and release history
  changes-log/                Per-date change logs
  release-notes/              Per-version release notes
CHANGELOG.md                  Top-level changelog
CONTRIBUTING.md               Contribution workflow
SECURITY.md                   Security policy
SUPPORT.md                    Support channels
```

## Quick Start

```bash
npm install
npm run build
npm run test:run
```

## Available Scripts

- `npm run build` Build library artifacts via Rollup
- `npm run test:run` Run tests using Jest
- `npm run test` Run lint and tests
- `npm run lint:run` Run linter
- `npm run lint:fix` Run linter with auto-fix
- `npm run build:docs` Generate API documentation with TypeDoc

## How to Use This Template

1. Update `package.json` metadata (`name`, `description`, `keywords`, repository URLs).
2. Implement your library inside `src/`.
3. Add or update tests.
4. Replace this README with project-specific usage examples.
5. Keep changelog and release notes updated for each release.

## Documentation

- [Docs Home](docs/README.md)
- [Summary](docs/SUMMARY.md)
- [Latest Release Notes](docs/release-notes/1.0.0.md)
- [Initial Changes Log](docs/changes-log/2026-apr-19.md)

## Contributing and Governance

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Support Guide](SUPPORT.md)

## Authors

- [Bayu Dwiyan Satria](https://github.com/bayudwiyansatria) - Creator and Maintainer

## Acknowledgments

Thanks to the open-source community and all contributors for support and inspiration.

## License

MIT. See [LICENSE](LICENSE).
