# Documentation

This is the developer book for `@bayudwiyansatria/core`. The API reference is generated separately by TypeDoc from the
public surface in [`src/index.ts`](../src/index.ts); everything a generator cannot infer lives here.

The Cloudflare adapters that implement these capabilities are documented separately, in
[`nodejs-cloudflare`](https://github.com/bayudwiyansatria/nodejs-cloudflare).

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
codebase moves on. `reference/` is a living doc — if you change the behavior it describes, update it in the same change.
