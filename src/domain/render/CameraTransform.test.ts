import { describe, it, expect } from "vitest";
import { CameraTransform } from "./CameraTransform";

describe("CameraTransform", () => {
  it("returns expected [a,b,c,d,e,f] for given camera/viewport/dpr", () => {
    const camera = { x: 10, y: 20, zoom: 2 };
    const width = 800;
    const height = 600;
    const dpr = 1.5;
    const [a, b, c, d, e, f] = CameraTransform.getTransform(camera, width, height, dpr);
    expect(a).toBeCloseTo(3); // dpr * zoom
    expect(b).toBe(0);
    expect(c).toBe(0);
    expect(d).toBeCloseTo(3);
    // tx = dpr * (vw/2 - x*zoom)
    expect(e).toBeCloseTo(1.5 * (800 / 2 - 10 * 2));
    // ty = dpr * (vh/2 - y*zoom)
    expect(f).toBeCloseTo(1.5 * (600 / 2 - 20 * 2));
  });
});
