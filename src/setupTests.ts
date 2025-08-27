import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Ensure React Testing Library cleans up between tests to avoid DOM leaks
afterEach((): void => {
  cleanup();
});

// JSDOM does not implement canvas; provide a minimal, side-effect-free 2D context mock
const mockCtx = {
  save: (): void => {},
  restore: (): void => {},
  setTransform: (): void => {},
  fillRect: (): void => {},
  beginPath: (): void => {},
  moveTo: (): void => {},
  lineTo: (): void => {},
  stroke: (): void => {},
  get canvas(): HTMLCanvasElement {
    const el = document.createElement("canvas");
    el.width = 1024;
    el.height = 768;
    return el;
  },
};

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  // Casts are allowed in tests to simulate minimal environments
  value: (type?: string): CanvasRenderingContext2D | null =>
    // eslint-disable-next-line no-restricted-syntax
    type === "2d" ? (mockCtx as unknown as CanvasRenderingContext2D) : null,
});
