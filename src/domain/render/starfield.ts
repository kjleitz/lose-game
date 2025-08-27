import type { Camera } from "./camera";

function hash32(x: number, y: number, seed = 1337): number {
  // Simple integer hash to 32-bit unsigned
  let h = (x * 374761393 + y * 668265263 + seed) | 0;
  h = (h ^ (h >>> 13)) | 0;
  h = (h * 1274126177) | 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function rand(): number {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export interface StarfieldOptions {
  cellSize?: number; // world units per cell
  starsPerCell?: number; // max stars
  minSize?: number;
  maxSize?: number;
  color?: string; // base color
  alphaMin?: number;
  alphaMax?: number;
}

const defaultOpts: Required<StarfieldOptions> = {
  cellSize: 512,
  starsPerCell: 12,
  minSize: 0.5,
  maxSize: 1.8,
  color: "#9cc3ff",
  alphaMin: 0.25,
  alphaMax: 0.9,
};

export function drawStarfield(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  viewportWidth: number,
  viewportHeight: number,
  opts: StarfieldOptions = {},
): void {
  const { cellSize, starsPerCell, minSize, maxSize, color, alphaMin, alphaMax } = {
    ...defaultOpts,
    ...opts,
  };

  // Compute visible world bounds (in world units)
  const halfW = viewportWidth / (2 * cam.zoom);
  const halfH = viewportHeight / (2 * cam.zoom);
  const minX = cam.x - halfW;
  const maxX = cam.x + halfW;
  const minY = cam.y - halfH;
  const maxY = cam.y + halfH;

  const minCellX = Math.floor(minX / cellSize);
  const maxCellX = Math.floor(maxX / cellSize);
  const minCellY = Math.floor(minY / cellSize);
  const maxCellY = Math.floor(maxY / cellSize);

  ctx.save();
  ctx.fillStyle = color;
  for (let cy = minCellY; cy <= maxCellY; cy++) {
    for (let cx = minCellX; cx <= maxCellX; cx++) {
      const seed = hash32(cx, cy);
      const rand = mulberry32(seed);
      const count = Math.floor(rand() * starsPerCell);
      for (let i = 0; i < count; i++) {
        const sx = cx * cellSize + rand() * cellSize;
        const sy = cy * cellSize + rand() * cellSize;
        const size = minSize + (maxSize - minSize) * rand();
        const a = alphaMin + (alphaMax - alphaMin) * rand();
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}
