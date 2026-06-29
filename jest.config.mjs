import path from "path";

// jest.config.js
export default {
  preset: "ts-jest/presets/default-esm", // important: esm-compatible preset
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: path.resolve("tsconfig.test.json"),
      },
    ],
  },
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1", // fix for import paths in ESM
  },
  testEnvironment: "node",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/coverage/",
    "/codegen-templates/",
  ],
  transformIgnorePatterns: ["node_modules/(?!(node-fetch)/)"],
  collectCoverage: true,
};
