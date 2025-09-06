import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";

interface CrosshairOverlayProps {
  enabled: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  showHint?: boolean;
  onHintDone?: () => void;
}

export function CrosshairOverlay({
  enabled,
  canvasRef,
  showHint = false,
  onHintDone,
}: CrosshairOverlayProps): JSX.Element | null {
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const hintTimer = useRef<number | null>(null);

  useEffect(() => {
    const handle = (evt: MouseEvent): void => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setPos({ x: evt.clientX - rect.left, y: evt.clientY - rect.top });
    };
    window.addEventListener("mousemove", handle);
    return (): void => {
      window.removeEventListener("mousemove", handle);
    };
  }, [canvasRef]);

  // On enable, initialize crosshair to canvas center so it appears immediately
  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    setPos({ x: rect.width / 2, y: rect.height / 2 });
  }, [enabled, canvasRef]);

  useEffect(() => {
    if (!showHint) return;
    // Auto-hide hint after a short duration
    if (hintTimer.current) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => {
      if (onHintDone) onHintDone();
    }, 2500);
    return (): void => {
      if (hintTimer.current) window.clearTimeout(hintTimer.current);
    };
  }, [showHint, onHintDone]);

  if (!enabled) return null;

  const size = 12;
  const thickness = 2;
  const color = "#ffffff";
  const glow = "rgba(255,255,255,0.35)";

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {/* crosshair */}
      <svg
        width={size * 2}
        height={size * 2}
        style={{ position: "absolute", left: pos.x - size, top: pos.y - size }}
        viewBox={`0 0 ${size * 2} ${size * 2}`}
      >
        <g>
          {/* subtle glow */}
          <circle
            cx={size}
            cy={size}
            r={size - 1}
            stroke={glow}
            strokeWidth={thickness}
            fill="none"
          />
          {/* main ring */}
          <circle
            cx={size}
            cy={size}
            r={size - 2}
            stroke={color}
            strokeWidth={thickness}
            fill="none"
          />
          {/* cross bars */}
          <line x1={size} y1={2} x2={size} y2={6} stroke={color} strokeWidth={thickness} />
          <line
            x1={size}
            y1={size * 2 - 2}
            x2={size}
            y2={size * 2 - 6}
            stroke={color}
            strokeWidth={thickness}
          />
          <line x1={2} y1={size} x2={6} y2={size} stroke={color} strokeWidth={thickness} />
          <line
            x1={size * 2 - 2}
            y1={size}
            x2={size * 2 - 6}
            y2={size}
            stroke={color}
            strokeWidth={thickness}
          />
        </g>
      </svg>
      {/* hint tooltip */}
      {showHint ? (
        <div
          className="absolute text-[11px] text-white bg-hud-bg/85 border border-hud-accent/30 rounded px-2 py-1 shadow"
          style={{ left: pos.x + 16, top: pos.y + 16 }}
        >
          Aim with cursor
        </div>
      ) : null}
    </div>
  );
}
