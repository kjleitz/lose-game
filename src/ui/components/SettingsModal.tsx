import { useEffect, useState } from "react";
import type { Action } from "../../application/game/input";
import {
  getBindingsForAction,
  loadKeyBindingsFromStorage,
  resetKeyBindings,
  setKeyBinding,
} from "../../application/game/input";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  speed: number;
  onChangeSpeed: (n: number) => void;
}

const ACTION_LABELS: Record<Action, string> = {
  thrust: "Thrust",
  turnLeft: "Turn Left",
  turnRight: "Turn Right",
  fire: "Fire",
  interact: "Interact",
  boost: "Boost",
  speedUp: "Speed Up",
  speedDown: "Speed Down",
};

export default function SettingsModal({ open, onClose, speed, onChangeSpeed }: SettingsModalProps) {
  const [listeningAction, setListeningAction] = useState<Action | null>(null);

  useEffect(() => {
    loadKeyBindingsFromStorage();
  }, []);

  useEffect(() => {
    if (!open || !listeningAction) return;
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setKeyBinding(listeningAction, e.code);
      setListeningAction(null);
    };
    window.addEventListener("keydown", onKey, { once: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [open, listeningAction]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#0b0b0b] border border-gray-700 rounded shadow-xl w-[520px] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="hud-text text-sm">Settings</h2>
          <button
            type="button"
            className="px-2 py-1 text-xs bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <section className="space-y-2">
          <h3 className="hud-text text-xs opacity-70">Speed</h3>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0.25}
              max={5}
              step={0.25}
              value={speed}
              onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="hud-text text-xs w-12 text-right">{speed.toFixed(2)}x</div>
          </div>
        </section>

        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="hud-text text-xs opacity-70">Key Bindings</h3>
            <button
              type="button"
              className="px-2 py-1 text-[10px] bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
              onClick={() => {
                resetKeyBindings();
              }}
            >
              Reset Defaults
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.keys(ACTION_LABELS).map((a) => {
              const action = a as Action;
              const codes = getBindingsForAction(action);
              const label = ACTION_LABELS[action];
              const listening = listeningAction === action;
              return (
                <div
                  key={action}
                  className="flex items-center justify-between gap-2 border border-gray-700 rounded px-2 py-2"
                >
                  <div className="hud-text text-xs">{label}</div>
                  <div className="flex items-center gap-2">
                    <div className="hud-text text-[10px] opacity-70 min-w-[140px] text-right">
                      {listening ? "Press any key…" : (codes[0] ?? "(none)")}
                    </div>
                    <button
                      type="button"
                      className="px-2 py-1 text-[10px] bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
                      onClick={() => setListeningAction(action)}
                    >
                      Rebind
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
