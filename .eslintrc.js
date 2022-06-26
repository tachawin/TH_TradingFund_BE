module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'airbnb-base',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    'import/prefer-default-export': 'off',
    'lines-between-class-members': 'off',
    'class-methods-use-this': 'off',
    'no-console': 'off',
    'import/extensions': 'off',
    indent: 'off',
    quotes: [2, 'single', 'avoid-escape'],
    '@typescript-eslint/indent': ['error', 2],
    'max-len': 'off',
    'no-underscore-dangle': 'off',
    'no-shadow': 'off',
    'import/order': ['error', {
      pathGroups: [{
        pattern: '@/**',
        group: 'parent',
        position: 'before',
      }],
      groups: ['builtin', 'external', 'parent', 'sibling', 'index'],
      pathGroupsExcludedImportTypes: [],
      alphabetize: {
        order: 'asc',
        caseInsensitive: true,
      },
    }],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        moduleDirectory: ['node_modules', 'src/'],
      },
    },
  },
};
