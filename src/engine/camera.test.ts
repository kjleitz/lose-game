import { describe, it, expect } from "vitest";
import { createCamera, cameraTransform } from "./camera";

describe("cameraTransform", () => {
  it("centers the camera target at viewport center", () => {
    const cam = createCamera(100, 50, 1);
    const [a, , , d, e, f] = cameraTransform(cam, 800, 600, 2);
    expect(a).toBeCloseTo(2); // scale = dpr * zoom
    expect(d).toBeCloseTo(2);
    // tx = dpr * (vw/2 - x)
    expect(e).toBeCloseTo(2 * (800 / 2 - 100));
    expect(f).toBeCloseTo(2 * (600 / 2 - 50));
  });
});
