import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Default to fast Node env for non-UI tests; UI uses jsdom via match globs below.
    environment: "node",
    pool: "threads",
    // Allow Vitest to choose an appropriate number of workers
    setupFiles: "./src/setupTests.ts",
    css: true,
    environmentMatchGlobs: [
      ["src/**/*.test.tsx", "jsdom"],
      ["src/ui/**/*.{test,spec}.{ts,tsx}", "jsdom"],
      ["src/application/**/*.{test,spec}.{ts,tsx}", "jsdom"],
      ["src/domain/render/**/*.{test,spec}.{ts,tsx}", "jsdom"],
    ],
    include: [
      // Unit and component tests only
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["e2e/**", "tests-examples/**", "node_modules/**", "dist/**"],
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
