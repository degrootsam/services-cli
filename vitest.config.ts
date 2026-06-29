import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    typecheck: { tsconfig: "./tsconfig.test.json" },
    include: ["__tests__/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/codegen-templates/**",
    ],
    coverage: {
      provider: "v8",
      include: ["src/**"],
      reporter: ["text"],
    },
  },
});
