import type { JSX } from "react";
import {
  buildFillPath,
  buildOverfillPath,
  buildTrackPath,
  createGaugeGeometry,
} from "./gauge-math";

interface SpeedometerGaugeProps {
  speed: number;
  size?: number; // nominal control size (influences radius)
}

export function SpeedometerGauge({ speed, size = 120 }: SpeedometerGaugeProps): JSX.Element {
  const display = Number.isFinite(speed) ? speed : 0;

  // Gauge uses hard thresholds; no soft normalization needed for arcs

  const geo = createGaugeGeometry(size, 8);
  const trackD = buildTrackPath(geo);
  const fillD = buildFillPath(geo, Math.min(1, display / 600));
  const over = Math.max(0, (display - 600) / 600);
  const overD = over > 0 ? buildOverfillPath(geo, Math.min(1, over)) : "";

  return (
    <div className="flex flex-col items-center">
      <svg width={geo.width} height={geo.height} style={{ display: "block" }} aria-hidden>
        <path d={trackD} fill="none" stroke="#333" strokeWidth={geo.stroke} strokeLinecap="round" />
        <path d={fillD} fill="none" stroke="#0ff" strokeWidth={geo.stroke} strokeLinecap="round" />
        {overD ? (
          <path
            d={overD}
            fill="none"
            stroke="#f00"
            strokeWidth={geo.stroke}
            strokeLinecap="round"
          />
        ) : null}
        <circle cx={geo.cx} cy={geo.cy} r={2} fill="#888" />
      </svg>
      <div className="hud-text text-xs opacity-80">Speed</div>
      <div className="text-sm tabular-nums">{display.toFixed(2)}</div>
    </div>
  );
}
