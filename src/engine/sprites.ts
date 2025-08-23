export function drawShipTriangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color = "#57ffd8",
  size = 24,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  // Triangle pointing along +X axis
  const half = size / 2;
  ctx.moveTo(half, 0);
  ctx.lineTo(-half, -half * 0.6);
  ctx.lineTo(-half, half * 0.6);
  ctx.closePath();
  ctx.fillStyle = color + "AA"; // translucent fill
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawThruster(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  color = "#57ffd8",
  size = 24,
  power = 1,
) {
  // Draw a simple flare behind the ship
  const back = size / 2;
  const length = size * (0.8 + 1.2 * power);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(-back, 0);
  ctx.lineTo(-back - length, -size * 0.25);
  ctx.lineTo(-back - length, size * 0.25);
  ctx.closePath();
  ctx.fillStyle = color + "55"; // translucent inner
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
