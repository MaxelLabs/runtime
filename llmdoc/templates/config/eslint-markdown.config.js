module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:markdown/recommended'
  ],
  plugins: ['markdown'],
  overrides: [
    {
      files: ['*.md'],
      processor: 'markdown/markdown',
      rules: {
        // Markdown特定的代码块规则
        'no-unused-vars': 'off',
        'no-console': 'warn',
        'no-debugger': 'error',
        'no-alert': 'error'
      }
    },
    {
      files: ['**/*.md/*.js', '**/*.md/*.ts', '**/*.md/*.jsx', '**/*.md/*.tsx'],
      rules: {
        // 在markdown代码块中的规则
        'no-unused-vars': 'warn',
        'no-console': 'off',
        'no-debugger': 'warn',
        'import/no-unresolved': 'off',
        'import/no-extraneous-dependencies': 'off'
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    }
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts', '.jsx', '.tsx']
      }
    }
  },
  rules: {
    // 通用规则
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'never'],
    'eol-last': 'error',
    'no-trailing-spaces': 'error'
  }
};