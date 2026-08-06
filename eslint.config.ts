import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import prettierRecommended from 'eslint-plugin-prettier/recommended'

/**
 * Kind tags whose argument TypeDoc discards — see the rule below.
 */
const KIND_TAGS = ['class', 'interface', 'typedef', 'function', 'constant']

/**
 * Tags that restate a TypeScript modifier or annotation.
 */
const REDUNDANT_TAGS = ['public', 'private', 'protected', 'property', 'prop', 'type']

/**
 * @constant
 *
 * The documentation conventions TypeDoc cannot check for itself.
 *
 * @remarks
 * `typedoc.json` sets `treatWarningsAsErrors` with `validation.notDocumented`,
 * so a broken cross-reference or an undocumented export already fails
 * `npm run build:docs`. What TypeDoc cannot flag is documentation that is
 * *present but redundant* — a tag restating something TypeScript already says.
 * Those are the ones that rot, because nothing fails when the code moves on
 * without them.
 *
 * Each rule comes from a defect this codebase actually shipped:
 *
 * - **`kind-tag-without-argument`** — `@class KVService` rendered the bare word
 *   `KVService` as a stray paragraph in the summary of 24 generated pages.
 *   TypeDoc drops the tag, because TypeScript already knows the kind, and keeps
 *   its argument as prose. `@module` is exempt: its argument names the page.
 * - **`no-redundant-tag`** — `@public` and `@property { string }` duplicate the
 *   modifier and the type annotation on the following line. TypeDoc produces
 *   identical output without them, and they drift when a signature changes.
 * - **`one-declaration-per-file`** — a file named after the thing in it makes
 *   the path the answer to "where is this", and confines a change to one
 *   interface to one file. `index.ts` barrels are exempt.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
const documentation = {
  rules: {
    'kind-tag-without-argument': {
      meta: {
        type: 'problem',
        docs: { description: 'A JSDoc kind tag must carry no argument; TypeDoc leaks it into the summary.' },
        schema: []
      },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              if (comment.type !== 'Block' || !comment.value.startsWith('*')) {
                continue
              }

              comment.value.split('\n').forEach(line => {
                const match = line.match(new RegExp(`^\\s*\\*?\\s*@(${KIND_TAGS.join('|')})\\s+(\\S.*)$`))

                if (match) {
                  context.report({
                    loc: comment.loc,
                    message: `@${match[1]} must carry no argument — "${match[2].trim()}" is rendered as stray prose in the summary.`
                  })
                }
              })
            }
          }
        }
      }
    },

    'no-redundant-tag': {
      meta: {
        type: 'problem',
        docs: { description: 'Do not document what TypeScript already declares.' },
        schema: []
      },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              if (comment.type !== 'Block' || !comment.value.startsWith('*')) {
                continue
              }

              comment.value.split('\n').forEach(line => {
                const match = line.match(new RegExp(`^\\s*\\*?\\s*@(${REDUNDANT_TAGS.join('|')})\\b`))

                if (match) {
                  context.report({
                    loc: comment.loc,
                    message: `@${match[1]} restates what TypeScript already declares — remove it.`
                  })
                }
              })
            }
          }
        }
      }
    },

    'one-declaration-per-file': {
      meta: {
        type: 'problem',
        docs: { description: 'Every exported declaration belongs in a file named after it.' },
        schema: []
      },
      create(context) {
        return {
          'Program:exit'(program) {
            if (/[\\/]index\.ts$/.test(context.filename)) {
              return
            }

            const names = program.body
              .filter(node => node.type === 'ExportNamedDeclaration' && node.declaration)
              .flatMap(node =>
                node.declaration.type === 'VariableDeclaration'
                  ? node.declaration.declarations.map(d => d.id.name)
                  : [node.declaration.id?.name]
              )
              .filter(Boolean)

            if (names.length > 1) {
              context.report({
                loc: { line: 1, column: 0 },
                message: `This file exports ${names.length} declarations (${names.join(', ')}) — give each its own file.`
              })
            }
          }
        }
      }
    }
  }
}

/**
 * @constant
 *
 * ESLint flat configuration.
 *
 * Replaces the former `.eslintrc.json` / `.eslintignore` pair, which ESLint 10
 * no longer reads. Flat config cannot be expressed in JSON — plugins, parsers,
 * and shared bases are live objects rather than resolvable names — so ESLint 10
 * only accepts `eslint.config.{js,mjs,cjs,ts,mts,cts}`. TypeScript is used here
 * to match `rollup.config.ts`; loading it requires the `jiti` devDependency,
 * which ESLint declares as an optional peer.
 *
 * @author Bayu Dwiyan Satria
 * @version 1.0.0
 * @since 1.0.0
 */
export default tseslint.config(
  /**
   * Ignored paths — the former `.eslintignore`.
   */
  {
    ignores: [
      'node_modules/',
      'dist/',
      'lib/',
      'coverage/',
      'eslint.config.ts',
      'rollup.config.ts',
      '**/*.test.ts',
      '**/*.spec.ts'
    ]
  },

  /**
   * Shared bases — the former `extends` block.
   */
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettierRecommended,

  /**
   * Project sources.
   */
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        project: './tsconfig.json'
      },
      globals: {
        ...globals.es2020,
        ...globals.commonjs,
        ...globals.node
      }
    },
    plugins: {
      documentation
    },
    rules: {
      eqeqeq: 'off',
      curly: 'error',
      'multiline-comment-style': 'warn',
      'no-case-declarations': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      /*
       * An error rather than a warning: an unused import in a library is dead
       * weight that ships in the bundle. `^_` is the escape hatch for a
       * parameter that exists only to hold a position in a signature.
       */
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_'
        }
      ],
      /*
       * Formatting is Prettier's job, run through `npm run format`. Reporting it
       * as a lint error too means every reformat shows up twice.
       */
      'prettier/prettier': 'off',
      'documentation/kind-tag-without-argument': 'error',
      'documentation/no-redundant-tag': 'error',
      'documentation/one-declaration-per-file': 'error'
    }
  },

  /**
   * Kernel purity.
   *
   * This package is the layer every other one depends on, which holds only while
   * it names no vendor, no runtime, and no HTTP framework. A capability here
   * says *what* the application needs — a cache, a queue, relational storage —
   * and an adapter package says what provides it.
   *
   * The list below names the vendors that have actually been reached for so far.
   * It is not exhaustive and does not need to be: it is a tripwire for the
   * common cases, not a proof. Extend it when a new adapter arrives.
   *
   * A lint rule rather than a note in a comment, because the boundary is only
   * worth anything if it holds under later edits — and the import that breaks it
   * looks like every other import at the point it is written.
   *
   * When the kernel seems to need one of these, the answer is a new interface in
   * `src/types/capabilities/` and an implementation on the far side of the
   * boundary.
   */
  {
    files: ['src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@cloudflare/*',
                'cloudflare:*',
                '@aws-sdk/*',
                '@google-cloud/*',
                'hono',
                'hono/*',
                'express',
                'fastify'
              ],
              message:
                'The kernel must name no vendor, runtime, or HTTP framework. Describe what you need as an interface in src/types/capabilities/ and let an adapter package implement it.'
            }
          ]
        }
      ]
    }
  },

  /**
   * The leaf-layer boundary.
   *
   * `types/`, `constants/`, `exceptions/`, `security/`, and `utils/` describe
   * what the library exchanges, what it holds fixed, what it raises, and what it
   * computes. None of them is *the library doing something* — that is `core/`.
   *
   * Dependency arrows point into these five and never back out, which is what
   * lets any of them be read, tested, or lifted elsewhere without dragging the
   * configuration engine and the logger along.
   *
   * A lint rule rather than a convention, for the usual reason: a convention
   * lasts only as long as everyone remembers it, and the import that breaks the
   * boundary looks exactly like every other import at the point it is written.
   *
   * ```ts
   * // src/utils/Text.ts — fails `npm run lint`
   * import { resolve } from '@/core'
   * ```
   *
   * If a leaf genuinely needs something from `core/`, take it as an argument, or
   * move the shared piece down into a leaf.
   */
  {
    files: [
      'src/types/**/*.ts',
      'src/constants/**/*.ts',
      'src/exceptions/**/*.ts',
      'src/security/**/*.ts',
      'src/utils/**/*.ts'
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/core', '@/core/*', '@/index'],
              message:
                'A leaf layer must not import from core/. Take what you need as an argument, or move the shared piece down into types/, constants/, exceptions/, security/, or utils/.'
            }
          ]
        }
      ]
    }
  }
)
