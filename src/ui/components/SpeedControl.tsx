import type { JSX } from "react";

interface SpeedControlProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
}

export function SpeedControl({
  value,
  onChange,
  min = 0.25,
  max = 5,
}: SpeedControlProps): JSX.Element {
  const clamp = (n: number): number => Math.min(max, Math.max(min, n));
  const step = 0.25;
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="hud-text text-xs opacity-80">Speed: {value.toFixed(2)}x</div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="px-2 py-1 text-xs bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
          onClick={(): void => onChange(clamp(value - step))}
        >
          -
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
          onClick={(): void => onChange(1)}
        >
          1x
        </button>
        <button
          type="button"
          className="px-2 py-1 text-xs bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
          onClick={(): void => onChange(clamp(value + step))}
        >
          +
        </button>
      </div>
      <div className="hud-text text-[10px] opacity-60 ml-2">(Shift=boost, +/- keys)</div>
    </div>
  );
}
