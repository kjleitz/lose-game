import { describe, it, expect } from "vitest";
import {
  angleForPercent,
  buildFillPath,
  buildOverfillPath,
  buildTrackPath,
  createGaugeGeometry,
  leftAngle,
  polar,
  rightAngle,
} from "./gauge-math";

function extractLastXY(d: string): { x: number; y: number } {
  // Extract the end coords from the final 'A' command in the path
  const arcRegex =
    /A\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)\s+[01]\s+[01]\s+(-?\d+\.?\d*)\s+(-?\d+\.?\d*)/g;
  let match: RegExpExecArray | null = null;
  let last: RegExpExecArray | null = null;
  while ((match = arcRegex.exec(d)) !== null) {
    last = match;
  }
  if (!last) throw new Error("No arc command found in path");
  return { x: Number(last[4]), y: Number(last[5]) };
}

describe("gauge-math", () => {
  it("computes geometry sized to avoid clipping", () => {
    const geo = createGaugeGeometry(120, 8);
    // top y should be >= 0 and within height
    const topY = geo.cy - geo.radius;
    expect(topY).toBeGreaterThanOrEqual(0);
    expect(geo.height).toBeGreaterThan(topY);
  });

  it("maps 0..1 to angles from left to right across top", () => {
    const a0 = angleForPercent(0);
    const a1 = angleForPercent(1);
    const twoPi = Math.PI * 2;
    const norm = (a: number): number => {
      let v = a % twoPi;
      if (v < 0) v += twoPi;
      return v;
    };
    expect(norm(a0)).toBeCloseTo(leftAngle(), 6);
    expect(norm(a1)).toBeCloseTo(rightAngle(), 6); // 2π ≡ 0
    const mid = angleForPercent(0.5);
    expect(norm(mid)).toBeCloseTo(Math.PI * 1.5, 6); // top apex
  });

  it("builds a track path across the top semicircle", () => {
    const geo = createGaugeGeometry(120, 8);
    const d = buildTrackPath(geo);
    const start = polar(geo.cx, geo.cy, geo.radius, leftAngle());
    const end = polar(geo.cx, geo.cy, geo.radius, rightAngle());
    // Path should start at left and end at right
    expect(d.startsWith(`M ${start.x} ${start.y} A`)).toBe(true);
    const last = extractLastXY(d);
    expect(last.x).toBeCloseTo(end.x, 4);
    expect(last.y).toBeCloseTo(end.y, 4);
    // All points on top half have y <= cy
    expect(start.y).toBeLessThanOrEqual(geo.cy + 1e-6);
    expect(end.y).toBeLessThanOrEqual(geo.cy + 1e-6);
  });

  it("builds fill path that ends at the correct point for various percentages", () => {
    const geo = createGaugeGeometry(120, 8);
    for (const pct of [0, 0.25, 0.5, 0.75, 1]) {
      const d = buildFillPath(geo, pct);
      const expected = polar(geo.cx, geo.cy, geo.radius, angleForPercent(pct));
      const last = extractLastXY(d);
      expect(last.x).toBeCloseTo(expected.x, 4);
      expect(last.y).toBeCloseTo(expected.y, 4);
      // Ensure progression stays on or above center line
      expect(last.y).toBeLessThanOrEqual(geo.cy + 1e-6);
    }
  });

  it("builds overfill path from right back toward left for various overfill percentages", () => {
    const geo = createGaugeGeometry(120, 8);
    for (const over of [0.1, 0.5, 1.0]) {
      const d = buildOverfillPath(geo, over);
      const expectedEnd = polar(geo.cx, geo.cy, geo.radius, angleForPercent(1 - over));
      const last = extractLastXY(d);
      expect(last.x).toBeCloseTo(expectedEnd.x, 4);
      expect(last.y).toBeCloseTo(expectedEnd.y, 4);
    }
  });
});
