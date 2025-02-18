export default {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"], // ✅ Only look here
  testMatch: ["**/*.test.ts"], // ✅ Match test files only
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  globals: {
    "ts-jest": {
      isolatedModules: true, // ✅ Speeds up TypeScript compilation
    },
  },
  cache: true, // ✅ Enable caching
  maxWorkers: "50%", // ✅ Run in parallel (adjust based on CPU cores)
  verbose: false, // ✅ Reduce console noise
};
