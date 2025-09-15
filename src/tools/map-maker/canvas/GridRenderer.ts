import type { Point2D } from "../../../shared/types/geometry";

export interface GridConfig {
  size: number;
  color: string;
  opacity: number;
  majorLineInterval: number;
  majorLineColor: string;
  majorLineOpacity: number;
}

export class GridRenderer {
  private config: GridConfig;

  constructor(config: GridConfig) {
    this.config = config;
  }

  public render(
    context: CanvasRenderingContext2D,
    camera: { x: number; y: number; zoom: number },
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    if (this.config.size <= 0 || this.config.opacity <= 0) return;

    const { x: cameraX, y: cameraY, zoom } = camera;
    const gridSize = this.config.size * zoom;

    // Skip rendering if grid is too small or too large
    if (gridSize < 2 || gridSize > 200) return;

    // Calculate visible world bounds
    const worldLeft = cameraX;
    const worldTop = cameraY;
    const worldRight = cameraX + canvasWidth / zoom;
    const worldBottom = cameraY + canvasHeight / zoom;

    // Calculate grid line positions
    const startX = Math.floor(worldLeft / this.config.size) * this.config.size;
    const startY = Math.floor(worldTop / this.config.size) * this.config.size;

    context.save();

    // Set up line styles
    context.lineWidth = 1;
    context.globalAlpha = this.config.opacity;

    // Render vertical lines
    for (let x = startX; x <= worldRight; x += this.config.size) {
      const screenX = (x - cameraX) * zoom;
      const isMajorLine = x % (this.config.size * this.config.majorLineInterval) === 0;

      if (isMajorLine) {
        context.strokeStyle = this.config.majorLineColor;
        context.globalAlpha = this.config.majorLineOpacity;
        context.lineWidth = 2;
      } else {
        context.strokeStyle = this.config.color;
        context.globalAlpha = this.config.opacity;
        context.lineWidth = 1;
      }

      context.beginPath();
      context.moveTo(screenX, 0);
      context.lineTo(screenX, canvasHeight);
      context.stroke();
    }

    // Render horizontal lines
    for (let y = startY; y <= worldBottom; y += this.config.size) {
      const screenY = (y - cameraY) * zoom;
      const isMajorLine = y % (this.config.size * this.config.majorLineInterval) === 0;

      if (isMajorLine) {
        context.strokeStyle = this.config.majorLineColor;
        context.globalAlpha = this.config.majorLineOpacity;
        context.lineWidth = 2;
      } else {
        context.strokeStyle = this.config.color;
        context.globalAlpha = this.config.opacity;
        context.lineWidth = 1;
      }

      context.beginPath();
      context.moveTo(0, screenY);
      context.lineTo(canvasWidth, screenY);
      context.stroke();
    }

    context.restore();
  }

  public setConfig(config: Partial<GridConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): GridConfig {
    return { ...this.config };
  }

  public getSnapPosition(worldPos: Point2D): Point2D {
    return {
      x: Math.round(worldPos.x / this.config.size) * this.config.size,
      y: Math.round(worldPos.y / this.config.size) * this.config.size,
    };
  }

  public isGridVisible(zoom: number): boolean {
    const screenGridSize = this.config.size * zoom;
    return screenGridSize >= 4 && screenGridSize <= 100;
  }
}
