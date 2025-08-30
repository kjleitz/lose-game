export interface RadarPointScale {
  x: number;
  y: number;
  r: number;
}

export interface RadarArrow {
  points: Array<[number, number]>;
  cx: number;
  cy: number;
}

export class RadarService {
  RADAR_SIZE: number;
  RADAR_RANGE: number;

  constructor(screenW: number, screenH: number) {
    this.RADAR_SIZE = 140;
    this.RADAR_RANGE = Math.max(screenW, screenH) * 1.2;
  }

  toRadarCoordsAndScale(player: Point2D, x: number, y: number, radius: number): RadarPointScale {
    const dx = x - player.x;
    const dy = y - player.y;
    const scale = this.RADAR_SIZE / 2 / this.RADAR_RANGE;
    return {
      x: this.RADAR_SIZE / 2 + dx * scale,
      y: this.RADAR_SIZE / 2 + dy * scale,
      r: Math.max(2, radius * scale),
    };
  }

  getEdgeArrow(angle: number): RadarArrow {
    const radius = this.RADAR_SIZE / 2 - 6;
    const cx = this.RADAR_SIZE / 2 + Math.cos(angle) * radius;
    const cy = this.RADAR_SIZE / 2 + Math.sin(angle) * radius;
    const size = 12;
    const tipX = cx + Math.cos(angle) * size;
    const tipY = cy + Math.sin(angle) * size;
    const leftX = cx + Math.cos(angle + Math.PI * 0.75) * size * 0.6;
    const leftY = cy + Math.sin(angle + Math.PI * 0.75) * size * 0.6;
    const rightX = cx + Math.cos(angle - Math.PI * 0.75) * size * 0.6;
    const rightY = cy + Math.sin(angle - Math.PI * 0.75) * size * 0.6;
    return {
      points: [
        [tipX, tipY],
        [leftX, leftY],
        [rightX, rightY],
      ],
      cx,
      cy,
    };
  }
}
import type { Point2D } from "../../shared/types/geometry";
