import type { JSX } from "react";
import type { Planet } from "../../../domain/game/planets";
import { PlanetSvg } from "../../icons/PlanetSvg";
import { RadarService } from "../../../domain/services/RadarService";
import type { Point2D } from "../../../shared/types/geometry";

interface RadarProps {
  player: Point2D;
  planets: Planet[];
  screenW: number;
  screenH: number;
}

export function Radar({ player, planets, screenW, screenH }: RadarProps): JSX.Element {
  const radarService = new RadarService(screenW, screenH);
  const RADAR_SIZE = radarService.RADAR_SIZE;
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
        {/* Player dot */}
        <circle
          cx={RADAR_SIZE / 2}
          cy={RADAR_SIZE / 2}
          r={6}
          fill="#fff"
          stroke="#0ff"
          strokeWidth={2}
        />
        {/* Planets and edge indicators */}
        {planets.map((planet) => {
          const dx = planet.x - player.x;
          const dy = planet.y - player.y;
          const angle = Math.atan2(dy, dx);
          const { x, y, r } = radarService.toRadarCoordsAndScale(
            player,
            planet.x,
            planet.y,
            planet.radius,
          );
          const radarCenter = RADAR_SIZE / 2;
          const radarRadius = radarCenter - 2;
          const distToCenter = Math.hypot(x - radarCenter, y - radarCenter);
          if (distToCenter <= radarRadius + r) {
            return (
              <g key={planet.id} clipPath="url(#radar-clip)">
                <PlanetSvg planet={planet} x={x} y={y} r={r} />
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill="none"
                  stroke="#fff"
                  strokeWidth={1}
                  opacity={0.8}
                />
              </g>
            );
          } else {
            const arrow = radarService.getEdgeArrow(angle);
            return (
              <polygon
                key={planet.id}
                points={arrow.points.map(([px, py]) => `${px},${py}`).join(" ")}
                fill={planet.color}
                stroke="#fff"
                strokeWidth={1}
                opacity={0.85}
              />
            );
          }
        })}
      </svg>
    </div>
  );
}
