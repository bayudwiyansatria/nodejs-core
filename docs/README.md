# Documentation

This is the developer book for `@bayudwiyansatria/core`. The API reference is generated separately by TypeDoc from the
public surface in [`src/index.ts`](../src/index.ts); everything a generator cannot infer lives here.

Each adapter package documents its own implementations of these capabilities.

## [`reference/`](./reference/)

| Doc                                              | Covers                                                               |
| ------------------------------------------------ | -------------------------------------------------------------------- |
| [configuration.md](./reference/configuration.md) | `configure`, `resolve`, merge semantics, and the ordering constraint |

## [`release-notes/`](./release-notes/)

Per-version release notes — what shipped in each release.

## [`changes-log/`](./changes-log/)

Dated engineering change log (`YYYY-MM-DD.md`) — a more granular, chronological record of what changed and why.

---

Historical docs (`release-notes/`, `changes-log/`) are point-in-time records and are not updated retroactively when the
codebase moves on, except to correct formatting, links, or factual errors. `reference/` is a living doc — if you change
the behavior it describes, update it in the same change.
