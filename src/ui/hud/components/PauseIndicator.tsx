export function PauseIndicator({ paused }: { paused: boolean }) {
  if (!paused) return null;
  return <div className="hud-text text-xs">paused</div>;
}
