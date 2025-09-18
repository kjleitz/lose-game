import type { JSX } from "react";

export interface SavedProjectSummary {
  key: string;
  name: string;
  type: "ship" | "planet";
  modified: string;
}

interface SavedProjectsPanelProps {
  items: SavedProjectSummary[];
  activeKey: string | null;
  onLoad: (key: string) => void;
  onDelete: (key: string) => void;
  onRefresh: () => void;
}

export function SavedProjectsPanel({
  items,
  activeKey,
  onLoad,
  onDelete,
  onRefresh,
}: SavedProjectsPanelProps): JSX.Element {
  return (
    <div className="hud-panel p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="hud-text text-sm font-medium">Saved Maps</span>
        <button
          type="button"
          onClick={onRefresh}
          className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
        >
          Refresh
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-gray-300 leading-snug">
          No saved maps found. Use the Save button to store your current project in localStorage.
        </p>
      ) : (
        <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {items.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <li
                key={item.key}
                className={`rounded border px-3 py-2 text-xs transition-colors ${
                  isActive ? "border-amber-400/80 bg-amber-400/10" : "border-gray-600 bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-[11px] text-gray-300">
                      {item.type === "ship" ? "Ship" : "Planet"} • {formatTimestamp(item.modified)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => onLoad(item.key)}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-white"
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item.key)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(
    date.getMinutes(),
  )}`;
}

function pad(input: number): string {
  return input < 10 ? `0${input}` : `${input}`;
}
