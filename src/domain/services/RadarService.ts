export class RadarService {
  RADAR_SIZE: number;
  RADAR_RANGE: number;

  constructor(screenW: number, screenH: number) {
    this.RADAR_SIZE = 140;
    this.RADAR_RANGE = Math.max(screenW, screenH) * 1.2;
  }

  toRadarCoordsAndScale(player: { x: number; y: number }, x: number, y: number, radius: number) {
    const dx = x - player.x;
    const dy = y - player.y;
    const scale = this.RADAR_SIZE / 2 / this.RADAR_RANGE;
    return {
      x: this.RADAR_SIZE / 2 + dx * scale,
      y: this.RADAR_SIZE / 2 + dy * scale,
      r: Math.max(2, radius * scale),
    };
  }

  getEdgeArrow(angle: number) {
    const r = this.RADAR_SIZE / 2 - 6;
    const cx = this.RADAR_SIZE / 2 + Math.cos(angle) * r;
    const cy = this.RADAR_SIZE / 2 + Math.sin(angle) * r;
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
