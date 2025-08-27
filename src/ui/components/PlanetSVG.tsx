import type { JSX } from "react";
import type { Planet } from "../../domain/game/planets";

export interface PlanetSvgProps {
  planet: Planet;
  x: number;
  y: number;
  r: number;
}

export function PlanetSvg({ planet, x, y, r }: PlanetSvgProps): JSX.Element {
  // Render main body
  const overlays: JSX.Element[] = [];
  if (planet.design === "ringed") {
    overlays.push(
      <ellipse
        key="ring"
        cx={x}
        cy={y}
        rx={r * 1.2}
        ry={r * 0.6}
        transform={`rotate(45 ${x} ${y})`}
        stroke="#fff"
        strokeWidth={r * 0.15}
        fill="none"
        opacity={0.5}
      />,
    );
  } else if (planet.design === "striped") {
    for (let i = -2; i <= 2; i++) {
      overlays.push(
        <circle
          key={`stripe-${i}`}
          cx={x}
          cy={y + r * (i / 3)}
          r={r * 0.3}
          fill="#fff"
          opacity={0.3}
        />,
      );
    }
  } else if (planet.design === "spotted") {
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const spotR = r * 0.7;
      overlays.push(
        <circle
          key={`spot-${i}`}
          cx={x + Math.cos(angle) * spotR}
          cy={y + Math.sin(angle) * spotR}
          r={r * 0.18}
          fill="#fff"
          opacity={0.4}
        />,
      );
    }
  }
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={planet.color} opacity={0.85} />
      {overlays}
    </g>
  );
}
