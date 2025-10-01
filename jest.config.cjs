const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const config = createJestConfig({
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/'],
});

module.exports = config;
