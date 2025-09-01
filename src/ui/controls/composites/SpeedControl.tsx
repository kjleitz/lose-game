import type { JSX } from "react";
import { Button } from "../primitives/Button";

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
  const clamp = (nextValue: number): number => Math.min(max, Math.max(min, nextValue));
  const step = 0.25;
  return (
    <div className="flex items-center gap-2 select-none">
      <div className="hud-text text-xs opacity-80">Speed: {value.toFixed(2)}x</div>
      <div className="flex items-center gap-1">
        <Button onClick={(): void => onChange(clamp(value - step))}>-</Button>
        <Button onClick={(): void => onChange(1)}>1x</Button>
        <Button onClick={(): void => onChange(clamp(value + step))}>+</Button>
      </div>
      <div className="hud-text text-[10px] opacity-60 ml-2">(Shift=boost, +/- keys)</div>
    </div>
  );
}
