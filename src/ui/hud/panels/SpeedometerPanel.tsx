import type { JSX } from "react";
import { Panel } from "../../controls";

interface SpeedometerPanelProps {
  speed: number;
}

export function SpeedometerPanel({ speed }: SpeedometerPanelProps): JSX.Element {
  const display = Number.isFinite(speed) ? speed : 0;
  return (
    <Panel className="px-4 py-3 flex flex-col space-y-2" style={{ minWidth: 140 }}>
      <div className="hud-text text-xs opacity-80">Speed</div>
      <div className="text-sm tabular-nums">{display.toFixed(2)}</div>
    </Panel>
  );
}
