# Readability

Code, tests, and documentation should let the next reader follow the intent without unpacking dense blocks. Formatting
changes preserve behavior, public names, response fields, and dependency boundaries.

## Logical spacing

Use two-space indentation, single quotes, no semicolons, and no trailing commas in TypeScript. Prettier wraps code at
120 characters where possible. Add blank lines between declarations, input validation, work, error handling, and
returns. Keep related declarations together.

```ts
const requested = Math.trunc(size)
const step = Number.isFinite(requested) && requested > 1 ? requested : 1
const batches: T[][] = []

for (let index = 0; index < values.length; index += step) {
  batches.push(values.slice(index, index + step))
}

return batches
```

Expand error branches into blocks. Use multiple lines for nested data or long calls when that makes the arguments easier
to compare. Do not insert a blank line after every statement.

Keep build configuration lists expanded with one entry per line, even when a short list fits within the print width.
`rollup.config.ts` is excluded from Prettier to preserve that layout; review its formatting manually.

## Tests

Name each case after the observable behavior. Separate setup, the action, and assertions when they are distinct steps. A
direct assertion around a pure function or promise is enough when there is no separate action to explain.

```ts
it('calls the loader on every read when no cache is available', async () => {
  const cache = new NoopCacheStore()
  const load = jest.fn(async () => 'loaded')

  await cache.remember(null, 'key', load)
  await cache.remember(null, 'key', load)

  expect(load).toHaveBeenCalledTimes(2)
})
```

Keep related fixtures in the same test file. Comments should explain a constraint or a regression that the case name
cannot convey. Avoid introductory paragraphs that repeat the assertions.

## Comments and documentation

Document every public export with complete JSDoc. Explain the contract, defaults, failure behavior, and constraints.
Keep useful examples and non-obvious decisions; remove commentary that restates a name or assignment.

Lead documentation with the concrete behavior or decision. Keep one main idea per paragraph and a blank line between
paragraphs. Put blank lines around headings, lists, and fenced examples. Use lists for steps or parallel facts and
tables for comparisons.

Reference guides describe current behavior. Release notes and dated engineering records preserve the state at the time,
except for corrections to formatting, links, or factual errors.

## Checks and review

Run these commands before requesting review:

```bash
npm run format
npm run lint:fix
npm test
npm run build
npm run build:docs
npm run build:docs:book
```

`npm test` checks formatting, lints source and tests, then runs Jest with coverage. `npm run format:check` checks
source, tests, Markdown, and the configured JSON and TypeScript tooling files without writing changes. Generated output
and the dependency lockfile are excluded from formatting.

Prettier handles syntax layout. ESLint checks spacing around declarations and control flow. Review the whole changed
file for logical grouping, clear names, and useful explanations; automated checks cannot judge those completely.
