import type { JSX } from "react";

export function SettingsButton({ onClick }: { onClick?: () => void }): JSX.Element {
  return (
    <button
      type="button"
      className="px-2 py-1 text-xs bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
      onClick={onClick}
      aria-label="Open settings"
    >
      ⚙︎
    </button>
  );
}
