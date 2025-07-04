/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["airbnb", "prettier", "plugin:import/recommended"],
  plugins: ["react", "react-hooks", "jsx-a11y", "import", "simple-import-sort"],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: { jsx: true },
  },
  settings: { react: { version: "detect" } },
  env: { browser: true, node: true, es2023: true },
  rules: {
    "react/react-in-jsx-scope": "off",
    "no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
    "import/no-unresolved": "off",
    "no-underscore-dangle": ["error", { allow: ["__dirname", "__filename"] }],
    "react/jsx-no-target-blank": ["error", { allowReferrer: true }],
    "simple-import-sort/imports": "error",
    "simple-import-sort/exports": "error",

    "import/order": "off",

    "sort-imports": "off",
  },
  overrides: [
    {
      files: ["vite.config.*", "vite.*.config.*", "scripts/**"],
      rules: {
        "import/no-extraneous-dependencies": "off",
      },
    },
  ],
  ignorePatterns: ["node_modules", "dist", "build"],
};
