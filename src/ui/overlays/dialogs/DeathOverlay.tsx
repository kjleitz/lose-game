import type { JSX } from "react";
import { useEffect } from "react";

interface DeathOverlayProps {
  open: boolean;
  onRespawn: () => void;
}

export function DeathOverlay({ open, onRespawn }: DeathOverlayProps): JSX.Element | null {
  // Allow pressing Enter/NumpadEnter to trigger respawn anywhere
  useEffect((): (() => void) => {
    if (!open) return () => {};
    const onKey = (evt: KeyboardEvent): void => {
      const isEnter = evt.code === "Enter" || evt.code === "NumpadEnter";
      const isSpace = evt.code === "Space" || evt.key === " " || evt.key === "Spacebar";
      if (isEnter || isSpace) {
        evt.preventDefault();
        onRespawn();
      }
    };
    window.addEventListener("keydown", onKey);
    return (): void => window.removeEventListener("keydown", onKey);
  }, [open, onRespawn]);
  if (!open) return null;
  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(255,0,0,0.2)" }}
    >
      <div className="hud-panel px-8 py-6 text-center pointer-events-auto">
        <div className="hud-text text-3xl tracking-widest mb-4">u ded</div>
        <button
          type="button"
          className="hud-btn focus:outline-none focus:ring-0"
          onClick={onRespawn}
          aria-label="respawn"
          autoFocus
        >
          alive?
        </button>
      </div>
    </div>
  );
}
