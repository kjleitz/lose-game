export function SettingsButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      data-testid="hud-settings-button"
      className="px-2 py-1 text-xs bg-gray-800 text-white rounded border border-gray-600 hover:bg-gray-700"
      onClick={onClick}
    >
      Settings
    </button>
  );
}
