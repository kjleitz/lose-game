import { describe, it, expect } from "vitest";
import { createCamera, cameraTransform, setCameraPosition, setCameraZoom } from "./camera";

describe("camera", () => {
  it("creates a camera with default values", () => {
    const cam = createCamera();
    expect(cam).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it("creates a camera with custom values", () => {
    const cam = createCamera(10, 20, 2);
    expect(cam).toEqual({ x: 10, y: 20, zoom: 2 });
  });

  it("sets camera position", () => {
    const cam = createCamera();
    setCameraPosition(cam, 100, 200);
    expect(cam.x).toBe(100);
    expect(cam.y).toBe(200);
  });

  it("sets camera zoom", () => {
    const cam = createCamera();
    setCameraZoom(cam, 3);
    expect(cam.zoom).toBe(3);
  });

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
