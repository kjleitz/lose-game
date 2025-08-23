import { describe, it, expect } from "vitest";
import { CameraTransform } from "./CameraTransform";

describe("CameraTransform", () => {
  it("calls getTransform and returns a value", () => {
    const camera = { x: 10, y: 20, zoom: 2 };
    const width = 800;
    const height = 600;
    const dpr = 1.5;
    const result = CameraTransform.getTransform(camera, width, height, dpr);
    expect(result).toBeDefined();
  });
});
