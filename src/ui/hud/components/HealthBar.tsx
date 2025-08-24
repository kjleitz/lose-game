interface HealthBarProps {
  value: number; // 0-100
}

export function HealthBar({ value }: HealthBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="flex items-center space-x-2">
      <span className="text-xs text-white">HP</span>
      <div
        data-testid="hud-health-panel"
        className="relative flex-1 h-4 bg-gray-900 rounded"
        style={{ minWidth: 100 }}
      >
        <div
          className="absolute left-0 top-0 h-4 rounded"
          style={{ width: `${pct}%`, background: "#e74c3c", transition: "width 0.3s" }}
        />
        <span className="absolute left-2 top-0 text-xs text-white" style={{ lineHeight: "1rem" }}>
          {value}
        </span>
      </div>
    </div>
  );
}
