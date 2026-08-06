import pkg from './package.json'
import dts from 'rollup-plugin-dts'

import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import eslint from '@rollup/plugin-eslint'
import serve from 'rollup-plugin-serve'

/**
 * Rollup build configuration.
 *
 * Builds `src/index.ts` — the library's entire published surface — into
 * CommonJS, ESM, and UMD bundles plus a standalone type declaration file, and
 * optionally serves the docs output when run with `NODE_ENV=dev`.
 *
 * Non-relative `@/…` imports are resolved by `@rollup/plugin-typescript` from
 * the `paths` mapping in `tsconfig.json`; no alias plugin is involved. If a bare
 * `@/…` specifier ever survives into a bundle, that resolution has broken.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */

/**---------------------------------------------------------------------------------------------------------------------
 * Distribution
 ----------------------------------------------------------------------------------------------------------------------*

 /**
 * CommonJS Options
 *
 * The output is `pkg.main`, which carries a `.cjs` extension and must keep it.
 * `package.json` declares `"type": "module"`, so Node reads a `.js` file in this
 * package as ESM — a CommonJS bundle written to `lib/index.min.js` parses as ESM
 * and `require()` of it returns nothing usable. `.cjs` is unambiguous whatever
 * `type` says.
 *
 * `exports` is 'named' because Rollup rejects the 'default' mode outright once
 * an entry has more than one export. Fixing it here means a fork that adds a
 * second export to `src/index.ts` — or a default one beside the named ones —
 * finds out at the moment it writes the code rather than at the next build.
 *
 * @type {{file: string, sourcemap: boolean, format: string}}
 */
const commonJsOptions = {
  file: pkg.main,
  format: 'cjs',
  sourcemap: true,
  exports: 'named'
}

/**
 * ESM Options
 *
 * @type {{file: string, sourcemap: boolean, format: string}}
 */
const esmOptions = {
  file: pkg.module,
  format: 'esm',
  sourcemap: true
}

/**
 * UMD Options
 *
 * `name` is the global a browser gets from a `<script>` tag, so it has to be a
 * valid identifier — a scoped package name is not. Rename it alongside
 * `package.json#name` when forking.
 *
 * The `.cjs` extension is for the same reason as the CommonJS output above:
 * under `"type": "module"` a `.js` UMD bundle is ESM to Node, which breaks the
 * `require()` half of what "universal" is supposed to mean. Browsers key off the
 * server's MIME type, not the extension, so a `<script src>` is unaffected.
 *
 * `exports` is 'named' for the same reason as the CommonJS output above, and has
 * to stay in step with it.
 *
 * @type {{file: string, sourcemap: boolean, format: string}}
 */
const umdOptions = {
  name: 'BayudwiyansatriaCore',
  file: 'lib/index.min.umd.cjs',
  format: 'umd',
  sourcemap: true,
  exports: 'named'
}

/**
 * Types Options
 *
 * `sourcemap` is off, unlike the bundle outputs. `rollup-plugin-dts` emits a
 * declaration map with `sources: []` and empty `mappings` — it has nothing to
 * point at, because the declarations are synthesised rather than transformed —
 * so the file is inert. It is also excluded from the published tarball by
 * `files: ["!lib/*.map"]`, which means nothing downstream could read it anyway.
 *
 * Emitting it is worse than useless: TypeDoc reads declaration maps when it
 * resolves a symbol from a dependency, indexes into that empty `sources` array,
 * and crashes on the `undefined` it gets back. A consumer running
 * `npm run build:docs` hits that with no indication the cause is here.
 *
 * @type {{file: string, sourcemap: boolean, format: string}}
 */
const typesOptions = {
  file: pkg.types,
  format: 'es',
  sourcemap: false
}

/**---------------------------------------------------------------------------------------------------------------------
 * Plugins
 ----------------------------------------------------------------------------------------------------------------------*
 /**
 * ESLint Option
 *
 * @type {Plugin}
 */
const eslintPluginOption = eslint({
  include: [
    'src/**/*.js', 
    'src/**/*.ts'
  ]
})

/**
 * TypeScript Option
 *
 * @type {Plugin}
 */
const typescriptPluginOption = typescript({
  tsconfig: `./tsconfig.json`
})

/**
 * Types Definition Option
 *
 * @type {Plugin}
 */
const definitionPluginOption = dts({})

/**
 * Terser Plugin Option
 *
 * @type {Plugin}
 */
const terserPluginOption = terser()

/**
 * Resolve Plugin
 *
 * @type {Plugin}
 */
const resolveOption = resolve()

/**---------------------------------------------------------------------------------------------------------------------
 * Functions
 ---------------------------------------------------------------------------------------------------------------------*/

/**
 * Print Warning on Console if Any
 *
 * Warnings originating inside `node_modules` are dropped: they are about code
 * this repository cannot fix, and printing them buries the ones it can.
 *
 * @param warning
 */
const printWarning = warning => {
  if (warning?.loc?.file?.includes('node_modules')) {
    return
  }
  console.log('[WARN]: ')
  console.log('\x1b[33m%s\x1b[0m', warning)
}

/**---------------------------------------------------------------------------------------------------------------------
 * Tasks
 ---------------------------------------------------------------------------------------------------------------------*/

/**
 * Task to Running Rollop
 * @type {[{output: {file: string, sourcemap: boolean, format: string}[], input: string, plugins: (Plugin|Plugin)[], onwarn: printWarning},{output: {file: string, sourcemap: boolean, format: string}[], input: string, plugins: Plugin[], onwarn: printWarning}]}
 */
const rollupTask = [
  {
    input: `src/index.ts`,
    output: [
      commonJsOptions, 
      esmOptions, 
      umdOptions
    ],
    plugins: [
      resolveOption, 
      eslintPluginOption, 
      typescriptPluginOption, 
      terserPluginOption
    ],
    onwarn: printWarning
  },
  {
    input: `src/index.ts`,
    output: [
      typesOptions
    ],
    plugins: [
      typescriptPluginOption, 
      definitionPluginOption
    ],
    onwarn: printWarning
  }
]

/**---------------------------------------------------------------------------------------------------------------------
 * Env
 ---------------------------------------------------------------------------------------------------------------------*/
let rollRun = Object.assign(rollupTask)

if (process.env.NODE_ENV === 'dev') {
  rollRun = Object.assign(
    rollRun[0],
    rollRun[0].plugins.push(
      serve({
        open: true,
        contentBase: ['./dist/docs'],
        host: 'localhost',
        port: '8080'
      })
    )
  )
}

/**
 * Run Rollup
 */
export default rollRun
