import type { JSX } from "react";

export function PauseIndicator({ paused }: { paused: boolean }): JSX.Element | null {
  if (!paused) return null;
  return <div className="hud-text text-xs">paused</div>;
}
