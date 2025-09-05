import type { JSX } from "react";
import type { Planet } from "../../../domain/game/planets";
import { PlanetSvg } from "../../icons/PlanetSvg";
import { RadarService } from "../../../domain/services/RadarService";
import type { Point2D } from "../../../shared/types/geometry";

interface RadarEnemy {
  id: string;
  x: number;
  y: number;
  radius: number;
}

interface RadarProps {
  player: Point2D;
  playerAngle?: number;
  planets: Planet[];
  stars?: Array<{ id: string; x: number; y: number; radius: number; color: string }>;
  enemies?: RadarEnemy[];
  screenW: number;
  screenH: number;
}

export function Radar({
  player,
  playerAngle = 0,
  planets,
  stars = [],
  enemies = [],
  screenW,
  screenH,
}: RadarProps): JSX.Element {
  const radarService = new RadarService(screenW, screenH);
  const RADAR_SIZE = radarService.RADAR_SIZE;
  const radarCenter = RADAR_SIZE / 2;
  const radarRadius = radarCenter - 2;

  function edgeAnchor(angle: number): { cx: number; cy: number } {
    const radius = RADAR_SIZE / 2 - 6;
    return {
      cx: RADAR_SIZE / 2 + Math.cos(angle) * radius,
      cy: RADAR_SIZE / 2 + Math.sin(angle) * radius,
    };
  }

  function planetEdgePolygon(angle: number): string {
    // Smaller than before; add a center notch (A-shape without crossbar)
    const size = 8; // tip length
    const baseHalf = 6; // half-width of base
    const notch = 3; // depth of the dent into the triangle (toward tip)
    const { cx, cy } = edgeAnchor(angle);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const lx = -Math.sin(angle);
    const ly = Math.cos(angle);
    const tipX = cx + ux * size;
    const tipY = cy + uy * size;
    const leftX = cx + lx * baseHalf;
    const leftY = cy + ly * baseHalf;
    const rightX = cx - lx * baseHalf;
    const rightY = cy - ly * baseHalf;
    // Inward dent toward the triangle tip (capital 'A' silhouette)
    const notchX = cx + ux * notch;
    const notchY = cy + uy * notch;
    return [
      `${tipX},${tipY}`,
      `${leftX},${leftY}`,
      `${notchX},${notchY}`,
      `${rightX},${rightY}`,
    ].join(" ");
  }

  function starEdgePath(angle: number): string {
    // Teardrop: triangle on top, rounded bottom (approximate circle arc)
    const size = 9; // a little smaller than before
    const baseHalf = 6;
    const { cx, cy } = edgeAnchor(angle);
    const ux = Math.cos(angle);
    const uy = Math.sin(angle);
    const lx = -Math.sin(angle);
    const ly = Math.cos(angle);
    const tipX = cx + ux * size;
    const tipY = cy + uy * size;
    const leftX = cx + lx * baseHalf;
    const leftY = cy + ly * baseHalf;
    const rightX = cx - lx * baseHalf;
    const rightY = cy - ly * baseHalf;
    const arcRadius = baseHalf; // arc radius ~= base half for a circular bottom
    // Path: tip -> right -> arc to left -> close
    // Use a small sweep; exact circle bottom is approximated across orientations
    // Use the arc that bows toward the radar center (teardrop bottom)
    // large-arc-flag=0, sweep-flag=0 from right -> left
    const pathD = [
      `M ${tipX} ${tipY}`,
      `L ${rightX} ${rightY}`,
      `A ${arcRadius} ${arcRadius} 0 0 0 ${leftX} ${leftY}`,
      `Z`,
    ].join(" ");
    return pathD;
  }

  function withinRadar(x: number, y: number, radiusAllowance: number = 0): boolean {
    const distToCenter = Math.hypot(x - radarCenter, y - radarCenter);
    return distToCenter <= radarRadius + radiusAllowance;
  }
  return (
    <div className="absolute right-8 bottom-8 z-10">
      <svg width={RADAR_SIZE} height={RADAR_SIZE} style={{ display: "block" }}>
        <defs>
          <clipPath id="radar-clip">
            <circle cx={RADAR_SIZE / 2} cy={RADAR_SIZE / 2} r={RADAR_SIZE / 2 - 2} />
          </clipPath>
        </defs>
        <circle
          cx={RADAR_SIZE / 2}
          cy={RADAR_SIZE / 2}
          r={RADAR_SIZE / 2 - 2}
          fill="#222"
          stroke="#888"
          strokeWidth={2}
        />
        {/* Player ship: small white triangle rotated by ship angle */}
        {((): JSX.Element => {
          const size = 8; // tip length
          const baseHalf = 4; // base half-width (narrower)
          const cx = radarCenter;
          const cy = radarCenter;
          const ux = Math.cos(playerAngle);
          const uy = Math.sin(playerAngle);
          const lx = -Math.sin(playerAngle);
          const ly = Math.cos(playerAngle);
          const tipX = cx + ux * size;
          const tipY = cy + uy * size;
          const leftX = cx + lx * baseHalf - ux * 2;
          const leftY = cy + ly * baseHalf - uy * 2;
          const rightX = cx - lx * baseHalf - ux * 2;
          const rightY = cy - ly * baseHalf - uy * 2;
          const points = `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
          return <polygon points={points} fill="#fff" opacity={0.95} />;
        })()}
        {/* Stars (draw first) */}
        {stars.map((star) => {
          const dx = star.x - player.x;
          const dy = star.y - player.y;
          const angle = Math.atan2(dy, dx);
          const {
            x,
            y,
            r: radius,
          } = radarService.toRadarCoordsAndScale(player, star.x, star.y, star.radius);
          if (withinRadar(x, y, radius)) {
            return (
              <g key={star.id} clipPath="url(#radar-clip)">
                <circle cx={x} cy={y} r={radius * 0.8} fill={star.color} opacity={0.9} />
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={1.5}
                  opacity={0.9}
                />
              </g>
            );
          } else {
            return <path key={star.id} d={starEdgePath(angle)} fill={star.color} opacity={0.95} />;
          }
        })}

        {/* Planets and edge indicators */}
        {planets.map((planet) => {
          const dx = planet.x - player.x;
          const dy = planet.y - player.y;
          const angle = Math.atan2(dy, dx);
          const {
            x,
            y,
            r: radius,
          } = radarService.toRadarCoordsAndScale(player, planet.x, planet.y, planet.radius);
          if (withinRadar(x, y, radius)) {
            return (
              <g key={planet.id} clipPath="url(#radar-clip)">
                <PlanetSvg planet={planet} x={x} y={y} r={radius} />
                <circle
                  cx={x}
                  cy={y}
                  r={radius}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={1}
                  opacity={0.8}
                />
              </g>
            );
          } else {
            return (
              <polygon
                key={planet.id}
                points={planetEdgePolygon(angle)}
                fill="#00c853"
                opacity={0.95}
              />
            );
          }
        })}

        {/* Enemies: red dots inside radar only (no edge indicators) */}
        {enemies.map((enemy) => {
          const { x, y } = radarService.toRadarCoordsAndScale(
            player,
            enemy.x,
            enemy.y,
            enemy.radius,
          );
          if (!withinRadar(x, y)) return null;
          return <circle key={enemy.id} cx={x} cy={y} r={3} fill="#ff3b30" opacity={0.95} />;
        })}
      </svg>
    </div>
  );
}
