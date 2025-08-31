import type { JSX } from "react";

interface PauseMenuProps {
  onResume: () => void;
  onDeleteData: () => void;
}

export function PauseMenu({ onResume, onDeleteData }: PauseMenuProps): JSX.Element {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#0b0b0b] border border-gray-700 rounded shadow-xl w-[420px] p-4 space-y-4">
        <h2 className="hud-text text-sm">Paused</h2>
        <div className="space-y-2">
          <button
            type="button"
            className="w-full px-3 py-2 text-sm bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
            onClick={onResume}
          >
            Resume (Esc)
          </button>
          <button
            type="button"
            className="w-full px-3 py-2 text-sm bg-red-800 text-white rounded border border-red-600 hover:bg-red-700"
            onClick={onDeleteData}
          >
            Delete Save Data
          </button>
        </div>
        <p className="hud-text text-[11px] opacity-70">
          Deleting will remove your saved settings, session, and key bindings.
        </p>
      </div>
    </div>
  );
}
