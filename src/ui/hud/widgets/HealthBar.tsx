import type { JSX } from "react";

export function HealthBar({ value }: { value: number }): JSX.Element {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-white">HP</span>
      <div className="relative flex-1 h-4 bg-gray-900 rounded" style={{ minWidth: 100 }}>
        <div
          className="absolute left-0 top-0 h-4 rounded bg-red-500"
          style={{ width: `${pct}%`, transition: "width 0.3s" }}
        />
        <span className="absolute left-2 top-0 text-xs text-white" style={{ lineHeight: "1rem" }}>
          {value}
        </span>
      </div>
    </div>
  );
}
