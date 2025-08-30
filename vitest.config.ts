import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Default to fast Node env for non-UI tests; UI uses jsdom via match globs below.
    // environment: "node",
    environment: "jsdom",
    pool: "threads",
    // Allow Vitest to choose an appropriate number of workers
    setupFiles: "./src/setupTests.ts",
    css: true,
    // environmentMatchGlobs: [
    //   ["src/**/*.test.tsx", "jsdom"],
    //   ["src/ui/**/*.{test,spec}.{ts,tsx}", "jsdom"],
    //   ["src/application/**/*.{test,spec}.{ts,tsx}", "jsdom"],
    //   ["src/domain/render/**/*.{test,spec}.{ts,tsx}", "jsdom"],
    // ],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["e2e/**", "tests-examples/**", "node_modules/**", "dist/**"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/**"],
      exclude: [
        "**/*.d.ts",
        "src/**/index.{ts,tsx}",
        "src/**/examples/**",
        "src/**/types/**",
        "src/**/types.ts",
        "src/**/*.{test,spec}.{ts,tsx}",
      ],
    },
  },
});
