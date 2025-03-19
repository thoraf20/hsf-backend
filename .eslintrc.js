module.exports = {
    env: {
      browser: false,
      node: true,
      es2021: true,
    },
    extends: [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "prettier" // Prettier integration
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 12,
      sourceType: "module",
    },
    plugins: ["@typescript-eslint", "prettier"],
    rules: {
      "prettier/prettier": "error", // Ensures Prettier rules are followed
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  };
  