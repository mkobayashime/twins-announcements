module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["import", "@typescript-eslint"],
  rules: {
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/no-namespace": 0,
    "import/order": [
      2,
      {
        alphabetize: { caseInsensitive: true, order: "asc" },
        groups: [["builtin", "external"], "parent", ["sibling", "index"]],
        "newlines-between": "always",
      },
    ],
    "import/first": 2,
  },
};
