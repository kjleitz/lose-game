import type { JSX } from "react";

interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
}

interface LayerPanelProps {
  layers: Layer[];
  onLayerToggle: (layerId: string, property: "visible" | "locked") => void;
  onLayerOpacityChange: (layerId: string, opacity: number) => void;
  onLayerReorder: (layerId: string, direction: "up" | "down") => void;
  className?: string;
}

export function LayerPanel({
  layers,
  onLayerToggle,
  onLayerOpacityChange,
  onLayerReorder,
  className,
}: LayerPanelProps): JSX.Element {
  return (
    <div className={`hud-panel p-4 ${className ?? ""}`}>
      <h3 className="hud-text text-lg font-semibold mb-4">Layers</h3>

      <div className="space-y-2">
        {layers.map((layer, index) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            canMoveUp={index > 0}
            canMoveDown={index < layers.length - 1}
            onToggle={(property) => onLayerToggle(layer.id, property)}
            onOpacityChange={(opacity) => onLayerOpacityChange(layer.id, opacity)}
            onReorder={(direction) => onLayerReorder(layer.id, direction)}
          />
        ))}
      </div>
    </div>
  );
}

interface LayerItemProps {
  layer: Layer;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onToggle: (property: "visible" | "locked") => void;
  onOpacityChange: (opacity: number) => void;
  onReorder: (direction: "up" | "down") => void;
}

function LayerItem({
  layer,
  canMoveUp,
  canMoveDown,
  onToggle,
  onOpacityChange,
  onReorder,
}: LayerItemProps): JSX.Element {
  return (
    <div className="p-3 bg-gray-800/50 rounded border border-gray-600">
      {/* Layer header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-300">{layer.name}</span>

        <div className="flex items-center space-x-1">
          {/* Reorder buttons */}
          <button
            type="button"
            onClick={() => onReorder("up")}
            disabled={!canMoveUp}
            className="p-1 text-xs text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move layer up"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={() => onReorder("down")}
            disabled={!canMoveDown}
            className="p-1 text-xs text-gray-400 hover:text-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
            title="Move layer down"
          >
            ▼
          </button>
        </div>
      </div>

      {/* Layer controls */}
      <div className="space-y-2">
        {/* Visibility and lock toggles */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={layer.visible}
              onChange={() => onToggle("visible")}
              className="w-3 h-3 text-amber-400 bg-gray-700 border-gray-600 rounded"
            />
            <span className="text-xs text-gray-400">👁</span>
          </label>

          <label className="flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={layer.locked}
              onChange={() => onToggle("locked")}
              className="w-3 h-3 text-amber-400 bg-gray-700 border-gray-600 rounded"
            />
            <span className="text-xs text-gray-400">🔒</span>
          </label>
        </div>

        {/* Opacity slider */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500 w-8">Op:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={layer.opacity}
            onChange={(event) => onOpacityChange(Number(event.target.value))}
            className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <span className="text-xs text-gray-400 w-8">{Math.round(layer.opacity * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
