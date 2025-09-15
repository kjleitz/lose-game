import type { Point2D } from "../../../shared/types/geometry";
import type { Wall } from "../../../domain/game/ship-interior/types";
import type { MapMakerEngine } from "../MapMakerEngine";
import { createId } from "../utils/id";

export interface WallDrawingState {
  isDrawing: boolean;
  startPoint: Point2D | null;
  currentPoint: Point2D | null;
  previewWall: Wall | null;
}

export class WallDrawingTool {
  private state: WallDrawingState = {
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
    previewWall: null,
  };
  private engine: MapMakerEngine;

  constructor(engine: MapMakerEngine) {
    this.engine = engine;
  }

  public startDrawing(point: Point2D): void {
    const snappedPoint = this.engine.snapToGrid(point);
    this.state = {
      isDrawing: true,
      startPoint: snappedPoint,
      currentPoint: snappedPoint,
      previewWall: null,
    };
    this.updatePreview();
  }

  public updateDrawing(point: Point2D): void {
    if (!this.state.isDrawing || !this.state.startPoint) return;

    const snappedPoint = this.engine.snapToGrid(point);
    this.state.currentPoint = snappedPoint;
    this.updatePreview();
  }

  public finishDrawing(): Wall | null {
    if (!this.state.isDrawing || !this.state.startPoint || !this.state.currentPoint) {
      this.cancelDrawing();
      return null;
    }

    // Don't create wall if start and end are the same
    if (
      this.state.startPoint.x === this.state.currentPoint.x &&
      this.state.startPoint.y === this.state.currentPoint.y
    ) {
      this.cancelDrawing();
      return null;
    }

    const wall = this.createWall(this.state.startPoint, this.state.currentPoint);
    this.resetState();
    return wall;
  }

  public cancelDrawing(): void {
    this.resetState();
  }

  public getState(): WallDrawingState {
    return { ...this.state };
  }

  public isDrawing(): boolean {
    return this.state.isDrawing;
  }

  public getPreviewWall(): Wall | null {
    return this.state.previewWall;
  }

  private updatePreview(): void {
    if (!this.state.startPoint || !this.state.currentPoint) {
      this.state.previewWall = null;
      return;
    }

    this.state.previewWall = this.createWall(this.state.startPoint, this.state.currentPoint);
  }

  private createWall(start: Point2D, end: Point2D): Wall {
    const thickness = this.engine.getToolPropertyNumber("thickness");
    const wallType = this.engine.getToolPropertyString("wallType");
    return {
      id: createId("wall"),
      x1: start.x,
      y1: start.y,
      x2: end.x,
      y2: end.y,
      thickness: thickness != null ? thickness : 8,
      type:
        wallType === "hull" || wallType === "interior" || wallType === "reinforced"
          ? wallType
          : "interior",
    };
  }

  private resetState(): void {
    this.state = {
      isDrawing: false,
      startPoint: null,
      currentPoint: null,
      previewWall: null,
    };
  }
}
