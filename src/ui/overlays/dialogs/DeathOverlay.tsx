import type { JSX } from "react";

interface DeathOverlayProps {
  open: boolean;
  onRespawn: () => void;
}

export function DeathOverlay({ open, onRespawn }: DeathOverlayProps): JSX.Element | null {
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(255,0,0,0.2)" }}
    >
      <div className="hud-panel px-8 py-6 text-center pointer-events-auto">
        <div className="hud-text text-3xl tracking-widest mb-4">u ded</div>
        <button type="button" className="btn" onClick={onRespawn} aria-label="respawn">
          alive?
        </button>
      </div>
    </div>
  );
}
