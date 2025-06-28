/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  testEnvironment: "node",
  transform: { "^.+\\.js$": "babel-jest" },
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  testMatch: ["**/tests/**/*.test.js"],
};

export default config;
