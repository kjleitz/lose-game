import type { AmmoType } from "../../shared/types/combat";

export type Team = "player" | "enemy" | "neutral";

export function projectileAngle(vx: number, vy: number): number {
  return Math.atan2(vy, vx);
}

export function orthoFromVelocity(vx: number, vy: number): { ox: number; oy: number } {
  const magnitude = Math.hypot(vx, vy) || 1;
  const nx = vx / magnitude;
  const ny = vy / magnitude;
  // Rotate 90 degrees CCW for orthogonal unit
  return { ox: -ny, oy: nx };
}

export function ammoCoreColor(ammo: AmmoType, team: Team = "player"): string {
  if (team !== "player") return team === "enemy" ? "#ff3b3b" : "#ffffff";
  switch (ammo) {
    case "kinetic":
      return "#ffb347"; // orange
    case "plasma":
      return "#31d3ff"; // cyan
    case "ion":
      return "#9c6bff"; // violet
    default:
      return "#ffcf3b"; // standard yellow
  }
}

export function ammoTrailHeadColor(ammo: AmmoType, team: Team = "player"): string {
  if (team !== "player") return team === "enemy" ? "rgba(255,80,80,0.9)" : "rgba(255,255,255,0.9)";
  switch (ammo) {
    case "kinetic":
      return "rgba(255,180,80,0.9)";
    case "plasma":
      return "rgba(80,220,255,0.9)";
    case "ion":
      return "rgba(180,120,255,0.9)";
    default:
      return "rgba(255,207,59,0.9)";
  }
}

export function trailTailFromHead(head: string): string {
  // Convert rgba(a,b,c,0.9) -> rgba(a,b,c,0)
  return head.replace(/0\.9\)$/, "0)");
}

export function drawIonAura(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  grad.addColorStop(0, "rgba(156,107,255,0.5)");
  grad.addColorStop(1, "rgba(156,107,255,0.0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawWavyLine(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  amplitude: number,
  cycles: number,
  phaseRad: number,
): void {
  const segments = 12;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy) || 1;
  const dirX = dx / len;
  const dirY = dy / len;
  const orthoX = -dirY;
  const orthoY = dirX;
  for (let i = 0; i <= segments; i++) {
    const tParam = i / segments;
    const x = fromX + dx * tParam;
    const y = fromY + dy * tParam;
    const waveOffset =
      Math.sin(phaseRad + tParam * Math.PI * 2 * cycles) * amplitude * (1 - tParam);
    const wx = x + orthoX * waveOffset;
    const wy = y + orthoY * waveOffset;
    if (i === 0) ctx.moveTo(wx, wy);
    else ctx.lineTo(wx, wy);
  }
}
