import pkg from './package.json'
import dts from 'rollup-plugin-dts'

import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import terser from '@rollup/plugin-terser'
import eslint from '@rollup/plugin-eslint'
import serve from 'rollup-plugin-serve'

/**---------------------------------------------------------------------------------------------------------------------
 * Distribution
 ----------------------------------------------------------------------------------------------------------------------*

 /**
 * CommonJS Options
 *
 * @type {{file: string, sourcemap: boolean, format: string}}
 */
const commonJsOptions = {
  file: pkg.main,
  format: 'cjs',
  sourcemap: true
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
 * @type {{file: string, sourcemap: boolean, format: string}}
 */
const umdOptions = {
  name: 'BayuAuthClient',
  file: 'lib/index.min.umd.js',
  format: 'umd',
  sourcemap: true
}

/**
 * Types Options
 *
 * @type {{file: string, sourcemap: boolean, format: string}}
 */
const typesOptions = {
  file: pkg.types,
  format: 'es',
  sourcemap: true
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
 * @param warning
 */
const printWarning = (warning) => {
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
    output: [commonJsOptions, esmOptions, umdOptions],
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
    output: [typesOptions],
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
  rollRun = Object.assign(rollRun[0], rollRun[0].plugins.push(serve({
    open: true,
    contentBase: ['./dist/docs'],
    host: 'localhost',
    port: '8080'
  })))
}

/**
 * Run Rollup
 */
export default rollRun
