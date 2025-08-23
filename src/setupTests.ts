import "@testing-library/jest-dom/vitest";

// JSDOM does not implement canvas; provide a minimal mock used by our renderer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockCtx: any = {
  save: () => {},
  restore: () => {},
  setTransform: () => {},
  fillRect: () => {},
  beginPath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  stroke: () => {},
  get canvas() {
    return { width: 1024, height: 768 } as HTMLCanvasElement;
  },
};

(HTMLCanvasElement.prototype as unknown as { getContext: () => typeof mockCtx }).getContext = () =>
  mockCtx;
