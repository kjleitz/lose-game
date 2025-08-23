import { describe, it, expect } from "vitest";
import { RadarService } from "./RadarService";

describe("RadarService", () => {
  it("initializes with correct radar size and range", () => {
    const radar = new RadarService(800, 600);
    expect(radar.RADAR_SIZE).toBe(140);
    expect(radar.RADAR_RANGE).toBe(Math.max(800, 600) * 1.2);
  });

  it("converts world coords to radar coords and scale", () => {
    const radar = new RadarService(800, 600);
    const player = { x: 100, y: 100 };
    const result = radar.toRadarCoordsAndScale(player, 200, 200, 50);
    expect(typeof result.x).toBe("number");
    expect(typeof result.y).toBe("number");
    expect(typeof result.r).toBe("number");
    expect(result.r).toBeGreaterThanOrEqual(2);
  });

  it("returns edge arrow points and center", () => {
    const radar = new RadarService(800, 600);
    const result = radar.getEdgeArrow(Math.PI / 2);
    expect(Array.isArray(result.points)).toBe(true);
    expect(result.points.length).toBe(3);
    expect(typeof result.cx).toBe("number");
    expect(typeof result.cy).toBe("number");
  });
});
