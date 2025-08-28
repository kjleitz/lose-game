import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Ensure React Testing Library cleans up between tests to avoid DOM leaks
afterEach((): void => {
  cleanup();
});

// JSDOM does not implement canvas; tests provide their own context mocks where needed.

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  // Return null; tests that require a context provide their own mock
  value: (type?: string): CanvasRenderingContext2D | null => (type === "2d" ? null : null),
});
