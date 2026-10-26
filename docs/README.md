# Documentation

This developer book covers configuration, contribution standards, and release history for `@bayudwiyansatria/core`.
TypeDoc generates the API reference separately from the public exports in [`src/index.ts`](../src/index.ts).

Each adapter package documents its own implementations of these capabilities.

## [`reference/`](./reference/)

| Doc                                              | Covers                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| [configuration.md](./reference/configuration.md) | `configure`, `resolve`, merge semantics, and the ordering constraint |
| [readability.md](./reference/readability.md)     | Logical spacing, comments, test structure, and formatting checks     |

## [`release-notes/`](./release-notes/)

Release notes describe what shipped in each version.

## [`changes-log/`](./changes-log/)

Dated engineering records (`YYYY-MM-DD.md`) explain individual changes and their verification.

---

Historical docs (`release-notes/`, `changes-log/`) are point-in-time records and are not updated retroactively when the
codebase moves on, except to correct formatting, links, or factual errors. `reference/` is a living doc — if you change
the behavior it describes, update it in the same change.
