/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["airbnb", "plugin:tailwindcss/recommended", "prettier"],
  plugins: ["react", "react-hooks", "jsx-a11y", "import", "tailwindcss"],
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
    "react/jsx-no-target-blank": ["error", { allowReferrer: true }],
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
