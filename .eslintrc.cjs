module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["**/tsconfig.json"],
  },
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  globals: { 'THREE': true },
  ignorePatterns: [
    '**/{node_modules,libs}',
    '*.js',
    '*.d.ts',
    'temp',
  ],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:promise/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:compat/recommended",
  ],
  plugins: [
    "@typescript-eslint",
    "compat",
  ],
  settings: {
    polyfills: [
      'WebGL2RenderingContext',
    ],
  },
  rules: {
    "arrow-parens": ["error", "as-needed"],
    "array-bracket-spacing": ["error", "never"],
    "brace-style": ["error", "1tbs", { "allowSingleLine": true }],
    "comma-dangle": ["error", "always-multiline"],
    "curly": "error",
    "generator-star-spacing": ["error", {
      "before": false,
      "after": true,
      "anonymous": "neither",
      "method": "neither"
    }],
    "new-parens": "error",
    "spaced-comment": "off",
    "no-multi-spaces": [
      "error",
      {
        "ignoreEOLComments": true
      }
    ],
    "no-console": ["error", { "allow": ["info", "warn", "error", "debug", "trace"] }],
    "no-inner-declarations": "error",
    "no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 1 }],
    "no-trailing-spaces": "error",
    "no-void": ["error", { "allowAsStatement": true }],
    "padding-line-between-statements": [
      "error",
      { "blankLine": "always", "prev": "*", "next": ["return", "break"] },
      { "blankLine": "never", "prev": "*", "next": ["case", "default"] },
      { "blankLine": "always", "prev": ["const", "let", "var"], "next": "*" },
      { "blankLine": "any", "prev": ["const", "let", "var"], "next": ["const", "let", "var"] }
    ],
    "promise/always-return": "off",
    "promise/catch-or-return": "error",
    "prefer-rest-params": "off",
    "semi": ["error", "always"],
    "space-in-parens": ["error", "never"],
    "@typescript-eslint/comma-spacing": "error",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "vars": "all", "varsIgnorePattern": "^_", "args": "none", "caughtErrors": "all", "caughtErrorsIgnorePattern": "^ignore" }
    ],
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/ban-types": ["error", { "types": { "{}": false, "Function": false, "Object": false } }],
    "@typescript-eslint/indent": ["error", 2, {
      "SwitchCase": 1,
      "ignoredNodes": [
        "ClassBody.body > PropertyDefinition[decorators.length > 0] > .key",
      ],
    }],
    "@typescript-eslint/keyword-spacing": "error",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-empty-function": "off",
    "@typescript-eslint/no-unnecessary-type-arguments": "error",
    "@typescript-eslint/no-unnecessary-type-assertion": "error",
    "@typescript-eslint/no-unnecessary-type-constraint": "error",
    "@typescript-eslint/no-redundant-type-constituents": "warn",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/object-curly-spacing": ["error", "always"],
    "@typescript-eslint/prefer-includes": "error",
    "@typescript-eslint/prefer-reduce-type-parameter": "error",
    "@typescript-eslint/prefer-ts-expect-error": "error",
    "@typescript-eslint/return-await": "error",
    "@typescript-eslint/restrict-plus-operands": "off",
    "@typescript-eslint/restrict-template-expressions": "off",
    "@typescript-eslint/space-infix-ops": ["error", { "int32Hint": false }],
    "@typescript-eslint/strict-boolean-expressions": "off",
    "@typescript-eslint/no-floating-promises": ["error", { "ignoreVoid": true, "ignoreIIFE": true }],
    "@typescript-eslint/quotes": ["error", "single"],
    "@typescript-eslint/require-await": "off",
    "@typescript-eslint/space-before-blocks": "error",
    "@typescript-eslint/space-before-function-paren": ["error", "always"],
    "@typescript-eslint/type-annotation-spacing": "error",
    "@typescript-eslint/unbound-method": "off",
    "@typescript-eslint/no-misused-promises": "off",
    "@typescript-eslint/prefer-regexp-exec": "off",
    "@typescript-eslint/semi": "error",
    "@typescript-eslint/member-delimiter-style": ["error", {
      "multiline": {
        "delimiter": "comma",
        "requireLast": true
      },
      "singleline": {
        "delimiter": "comma",
        "requireLast": false
      }
    }],
    "@typescript-eslint/no-unsafe-enum-comparison": "warn",
    "@typescript-eslint/no-base-to-string": "off",
    "@typescript-eslint/no-duplicate-enum-values": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/consistent-type-imports": [
      "error",
      {
        "prefer": "type-imports",
        "disallowTypeAnnotations": false,
      },
    ],
    "compat/compat": "error",
  },
  overrides: [
    {
      "files": ["**/test/**/*.ts", "**/demo/**/*.ts", "**/web-packages/**/*.ts"],
      "rules": {
        "compat/compat": "off",
        "@typescript-eslint/no-unused-vars": "off"
      }
    }
  ]
}; 