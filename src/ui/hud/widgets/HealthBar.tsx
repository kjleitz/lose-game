import type { JSX } from "react";

export function HealthBar({ current, max }: { current: number; max: number }): JSX.Element {
  const safeMax = max > 0 ? max : 1;
  const pct = Math.max(0, Math.min(100, (current / safeMax) * 100));
  const currInt = Math.max(0, Math.round(current));
  const maxInt = Math.max(0, Math.round(safeMax));
  return (
    <div className="flex items-center space-x-2">
      <span className="hud-text text-xs opacity-80">HP</span>
      <div className="relative flex-1 h-4 bg-hud-bg/60 rounded" style={{ minWidth: 120 }}>
        <div
          className="absolute left-0 top-0 h-4 rounded bg-hud-warning"
          style={{ width: `${pct}%`, transition: "width 0.25s linear" }}
        />
        {/* Readable label on a dark pill for contrast over yellow bar */}
        <span
          className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] px-1.5 rounded bg-black/60 text-white"
          style={{ lineHeight: "1" }}
        >
          {currInt}/{maxInt}
        </span>
      </div>
    </div>
  );
}
