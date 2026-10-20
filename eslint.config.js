import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
    { ignores: ['**/dist', '**/dev-dist', '**/node_modules', 'apps/server/src/generated'] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['apps/client/**/*.{ts,tsx}'],
        languageOptions: { globals: globals.browser },
        plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
        rules: {
            ...reactHooks.configs.recommended.rules,
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
        },
    },
    {
        files: ['apps/server/**/*.ts', 'packages/**/*.ts', '*.js'],
        languageOptions: { globals: globals.node },
    },
    {
        rules: {
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        },
    },
    prettier,
);
