// Utilities for a top semicircle gauge rendered via SVG arcs.
// No DOM or React dependencies; pure math for easy testing.

export interface GaugeGeometry {
  cx: number;
  cy: number;
  radius: number;
  stroke: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

export function createGaugeGeometry(size: number, stroke = 8): GaugeGeometry {
  const radius = Math.max(24, Math.min(64, Math.floor(size * 0.33)));
  const halfStroke = Math.ceil(stroke / 2);
  const padding = Math.max(6, halfStroke + 2);
  const cx = radius + padding;
  const cy = radius + padding; // center of circle; we will only show the top half
  const width = cx * 2; // padding on both sides
  // Height includes: top padding to apex, radius down to centerline, plus bottom padding and stroke allowance
  const height = radius + padding + halfStroke + padding;
  return { cx, cy, radius, stroke, width, height };
}

export function polar(cx: number, cy: number, radius: number, angleRad: number): Point {
  return { x: cx + Math.cos(angleRad) * radius, y: cy + Math.sin(angleRad) * radius };
}

export function leftAngle(): number {
  return Math.PI; // 180°
}

export function rightAngle(): number {
  return 0; // 0°
}

export function topAngle(): number {
  return Math.PI / 2; // 90°
}

export function rTopY(cy: number, radius: number): number {
  return cy - radius; // topmost y of the circle
}

// Map 0..1 to angle from left (π) to right (0) across the TOP using clockwise sweep.
export function angleForPercent(pct: number): number {
  const clamped = Math.max(0, Math.min(1, pct));
  // Traverse across the TOP: π (left) -> 2π (right)
  return Math.PI + Math.PI * clamped;
}

// Build an arc path segment between two angles along the clockwise (sweep=1) direction,
// assuming startAngle <= endAngle and both within a continuous range (no wrap across 0).
// Splits into smaller arcs if the span is >= π to avoid 180° ambiguity.
export function arcPathClockwiseNoWrap(
  cx: number,
  cy: number,
  radius: number,
  startAngleRad: number,
  endAngleRad: number,
): string {
  const a0 = startAngleRad;
  const a1 = endAngleRad;
  const span = Math.abs(a1 - a0);

  const segs: Array<{ from: number; to: number }> = [];
  if (span < Math.PI - 1e-6) {
    segs.push({ from: a0, to: a1 });
  } else {
    // Split into two segments at midpoint to avoid exactly π span
    const mid = a0 + span / 2;
    segs.push({ from: a0, to: mid });
    segs.push({ from: mid, to: a1 });
  }

  const start = polar(cx, cy, radius, segs[0].from);
  let path = `M ${start.x} ${start.y}`;
  for (const seg of segs) {
    const toPt = polar(cx, cy, radius, seg.to);
    const segSpan = Math.abs(seg.to - seg.from);
    const largeArcFlag = segSpan > Math.PI ? 1 : 0;
    const sweepFlag = 1; // clockwise across top (in SVG's y-down system)
    path += ` A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${toPt.x} ${toPt.y}`;
  }
  return path;
}

// Build an arc path going counterclockwise (right to left across the top),
// assuming startAngle >= endAngle and both within the top half without wrap.
export function arcPathCcwNoWrap(
  cx: number,
  cy: number,
  radius: number,
  startAngleRad: number,
  endAngleRad: number,
): string {
  const a0 = startAngleRad;
  const a1 = endAngleRad;
  const span = Math.abs(a0 - a1);
  const segs: Array<{ from: number; to: number }> = [];
  if (span < Math.PI - 1e-6) {
    segs.push({ from: a0, to: a1 });
  } else {
    const mid = a0 - span / 2;
    segs.push({ from: a0, to: mid });
    segs.push({ from: mid, to: a1 });
  }
  const start = polar(cx, cy, radius, segs[0].from);
  let path = `M ${start.x} ${start.y}`;
  for (const seg of segs) {
    const toPt = polar(cx, cy, radius, seg.to);
    const segSpan = Math.abs(seg.to - seg.from);
    const largeArcFlag = segSpan > Math.PI ? 1 : 0;
    const sweepFlag = 0; // counterclockwise across top
    path += ` A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${toPt.x} ${toPt.y}`;
  }
  return path;
}

// Track path: top semicircle from left to right via clockwise sweep.
export function buildTrackPath(geo: GaugeGeometry): string {
  // Explicitly draw top semicircle in two segments to avoid 180° ambiguity: π -> 3π/2 -> 2π
  const a0 = leftAngle();
  const mid = Math.PI * 1.5;
  const a1 = Math.PI * 2;
  const first = arcPathClockwiseNoWrap(geo.cx, geo.cy, geo.radius, a0, mid);
  // 'M' already at start; append next arc by replacing initial 'M ...' to only keep subsequent 'A'
  const second = arcPathClockwiseNoWrap(geo.cx, geo.cy, geo.radius, mid, a1).replace(
    /^M [^A]+/,
    "",
  );
  return first + second;
}

// Fill path from left to the current percentage along the same track.
export function buildFillPath(geo: GaugeGeometry, pct: number): string {
  const end = angleForPercent(pct);
  const a0 = leftAngle();
  const mid = Math.PI * 1.5;
  if (end <= mid + 1e-8) {
    return arcPathClockwiseNoWrap(geo.cx, geo.cy, geo.radius, a0, end);
  }
  const first = arcPathClockwiseNoWrap(geo.cx, geo.cy, geo.radius, a0, mid);
  const second = arcPathClockwiseNoWrap(geo.cx, geo.cy, geo.radius, mid, end).replace(
    /^M [^A]+/,
    "",
  );
  return first + second;
}

// Overfill path: from right back toward left by the given overfill percentage (0..1).
export function buildOverfillPath(geo: GaugeGeometry, overPct: number): string {
  const clamped = Math.max(0, Math.min(1, overPct));
  if (clamped <= 0) return "";
  const start = Math.PI * 2; // treat right as 2π to avoid wrap
  const end = angleForPercent(1 - clamped); // move left by clamped proportion
  const mid = Math.PI * 1.5;
  if (end >= mid - 1e-8) {
    return arcPathCcwNoWrap(geo.cx, geo.cy, geo.radius, start, end);
  }
  const first = arcPathCcwNoWrap(geo.cx, geo.cy, geo.radius, start, mid);
  const second = arcPathCcwNoWrap(geo.cx, geo.cy, geo.radius, mid, end).replace(/^M [^A]+/, "");
  return first + second;
}
