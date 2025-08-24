interface ActionReadoutProps {
  actions: Set<string>;
}

export function ActionReadout({ actions }: ActionReadoutProps) {
  return (
    <div className="hud-text text-xs opacity-80">{Array.from(actions).join(", ") || "idle"}</div>
  );
}
