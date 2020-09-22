module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: [
        'plugin:vue/essential',
        '@vue/standard',
        '@vue/typescript/recommended'
    ],
    parserOptions: {
        ecmaVersion: 2020
    },
    rules: {
        'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        'quotes': 'off',
        '@typescript-eslint/quotes': ['error', 'single'],
        'semi': 'off',
        '@typescript-eslint/semi': ['error', 'never'],
        'indent': 'off',
        '@typescript-eslint/indent': ['error', 4],
        'vue/html-indent': ['error', 4],
        'vue/script-indent': ['error', 4],
        'space-before-function-paren': 'off',
        '@typescript-eslint/space-before-function-paren': ['error', {
            anonymous: 'always',
            named: 'never',
            asyncArrow: 'always'
        }],
        'quote-props': ['error', 'consistent'],
        'space-infix-ops': ['error'],
        'no-useless-constructor': 'off',
        '@typescript-eslint/no-useless-constructor': ['error'],
        '@typescript-eslint/array-type': ['error', {
            default: 'generic'
        }],
        '@typescript-eslint/class-literal-property-style': 'error',
        '@typescript-eslint/member-delimiter-style': ['error', {
            'multiline': {
                'delimiter': 'none',
                'requireLast': false
            },
            'singleline': {
                'delimiter': 'semi',
                'requireLast': false
            }
        }],
        '@typescript-eslint/method-signature-style': ['error', 'property'],
        'lines-between-class-members': 'off',
        '@typescript-eslint/lines-between-class-members': ['error', {
            'exceptAfterSingleLine': true
        }],
        '@typescript-eslint/type-annotation-spacing': ['error'],
        'no-void': 'off'
    },
    overrides: [
        {
            files: [
                '**/__tests__/*.{j,t}s?(x)',
                '**/tests/**/*.spec.{j,t}s?(x)'
            ],
            env: {
                jest: true
            }
        },
        {
            files: [
                'src/**/*.ts',
                'src/**/*.tsx',
                'src/**/*.vue',
                'tests/**/*.ts',
                'tests/**/*.tsx'
            ],
            extends: [
                'plugin:@typescript-eslint/recommended-requiring-type-checking'
            ],
            parser: require.resolve('vue-eslint-parser'),
            parserOptions: {
                tsconfigRootDir: __dirname,
                project: ['./tsconfig.json']
            },
            rules: {
                'camelcase': 'off',
                '@typescript-eslint/naming-convention': [
                    'error',
                    {
                        'selector': 'default',
                        'format': ['camelCase']
                    },
                    {
                        'selector': 'variable',
                        'format': ['camelCase', 'UPPER_CASE']
                    },
                    {
                        'selector': 'parameter',
                        'format': ['camelCase'],
                        'leadingUnderscore': 'allow'
                    },
                    {
                        'selector': 'memberLike',
                        'format': ['camelCase'],
                        'trailingUnderscore': 'allow'
                    },
                    {
                        'selector': 'memberLike',
                        'modifiers': ['private'],
                        'format': ['camelCase'],
                        'leadingUnderscore': 'require'
                    },
                    {
                        'selector': 'typeLike',
                        'format': ['PascalCase']
                    }
                ],
                '@typescript-eslint/no-unnecessary-condition': 'warn',
                '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'warn'
            }
        }
    ]
}
