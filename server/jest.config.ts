import type { Config } from "jest";
const path = require("path");
const config: Config = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: true,
      },
    ],
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "./coverage",
  testEnvironment: "node",
  preset: "@shelf/jest-mongodb",
  watchPathIgnorePatterns: ["globalConfig"],
  transformIgnorePatterns: ["/node_modules/(?!(nanoid)/)", "/node_modules/(?!@noctaCrdt)"],
  extensionsToTreatAsEsm: [".ts"],
  moduleNameMapper: {
    "^@noctaCrdt$": "<rootDir>/../@noctaCrdt/dist/src/Crdt.js",
    "^@noctaCrdt/(.*)$": path.join(__dirname, "../@noctaCrdt/dist/src/$1"),
    "^nanoid$": require.resolve("nanoid"),
  },
  modulePaths: [path.join(__dirname, ".."), "node_modules"],
};

export default config;
