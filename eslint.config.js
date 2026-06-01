import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const reactHooksRules = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',
};

const sharedRules = {
  curly: ['error', 'all'],
  // Only require const when every binding in a destructuring can be const,
  // so patterns that legitimately reassign one member stay valid.
  'prefer-const': ['error', { destructuring: 'all' }],
  '@typescript-eslint/no-unused-vars': [
    'error',
    { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
  ],
  // Existing RCON response-handling code leans on `any`; surface as a warning
  // so lint stays green while the usages remain visible to tighten over time.
  '@typescript-eslint/no-explicit-any': 'warn',
};

export default tseslint.config(
  { ignores: ['dist', 'build', 'coverage', 'node_modules'] },

  // Browser-side application code (React + Vite)
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      ...reactHooksRules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      ...sharedRules,
    },
  },

  // Node-side code (server, build tooling, configs)
  {
    files: ['*.ts', 'server/**/*.ts', '*.config.{ts,js}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.node,
    },
    rules: sharedRules,
  },

  // Disable ESLint rules that conflict with Prettier — keep this last.
  prettier,
);
