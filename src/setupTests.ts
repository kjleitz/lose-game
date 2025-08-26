import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Ensure React Testing Library cleans up between tests to avoid DOM leaks
afterEach(() => {
  cleanup();
});

// JSDOM does not implement canvas; provide a minimal, side-effect-free 2D context mock
const mockCtx = {
  save: () => {},
  restore: () => {},
  setTransform: () => {},
  fillRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  get canvas() {
    const el = document.createElement("canvas");
    el.width = 1024;
    el.height = 768;
    return el;
  },
};

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  value: (type?: string) => (type === "2d" ? mockCtx : null),
});
