module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ["@mkobayashime", "@mkobayashime/typescript"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["import", "@typescript-eslint"],
  rules: {},
};
