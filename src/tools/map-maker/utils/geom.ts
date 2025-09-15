import type { Point2D } from "../../../shared/types/geometry";

export interface RectBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function distanceToLineSegment(
  point: Point2D,
  lineStart: Point2D,
  lineEnd: Point2D,
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ddx = point.x - lineStart.x;
    const ddy = point.y - lineStart.y;
    return Math.sqrt(ddx * ddx + ddy * ddy);
  }
  const tVal = Math.max(
    0,
    Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSq),
  );
  const px = lineStart.x + tVal * dx;
  const py = lineStart.y + tVal * dy;
  const ddx = point.x - px;
  const ddy = point.y - py;
  return Math.sqrt(ddx * ddx + ddy * ddy);
}

export function isPointInCircle(point: Point2D, center: Point2D, radius: number): boolean {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  return Math.sqrt(dx * dx + dy * dy) <= radius;
}

export function isPointInBounds(point: Point2D, bounds: RectBounds): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

export function boundsIntersect(boundsA: RectBounds, boundsB: RectBounds): boolean {
  return (
    boundsA.x < boundsB.x + boundsB.width &&
    boundsA.x + boundsA.width > boundsB.x &&
    boundsA.y < boundsB.y + boundsB.height &&
    boundsA.y + boundsA.height > boundsB.y
  );
}
