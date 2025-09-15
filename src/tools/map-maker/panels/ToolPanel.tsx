import type { JSX } from "react";
import type { EditingTool } from "../types/EditingTools";

interface ToolPanelProps {
  tools: EditingTool[];
  activeTool: EditingTool | null;
  onToolSelect: (toolId: string) => void;
  className?: string;
}

export function ToolPanel({
  tools,
  activeTool,
  onToolSelect,
  className,
}: ToolPanelProps): JSX.Element {
  const groupedTools = tools.reduce<Record<string, EditingTool[]>>((groups, tool) => {
    if (groups[tool.category] == null) {
      groups[tool.category] = [];
    }
    groups[tool.category].push(tool);
    return groups;
  }, {});

  return (
    <div className={`hud-panel p-4 ${className != null ? className : ""}`}>
      <h3 className="hud-text text-lg font-semibold mb-4">Tools</h3>

      <div className="space-y-4">
        {Object.entries(groupedTools).map(([category, categoryTools]) => (
          <div key={category} className="space-y-2">
            <h4 className="hud-text text-sm font-medium capitalize opacity-75">{category}</h4>

            <div className="grid grid-cols-2 gap-2">
              {categoryTools.map((tool) => (
                <ToolButton
                  key={tool.id}
                  tool={tool}
                  isActive={activeTool?.id === tool.id}
                  onClick={() => onToolSelect(tool.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ToolButtonProps {
  tool: EditingTool;
  isActive: boolean;
  onClick: () => void;
}

function ToolButton({ tool, isActive, onClick }: ToolButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center p-2 rounded border-2 transition-colors
        ${
          isActive
            ? "border-amber-400 bg-amber-400/20 text-amber-400"
            : "border-gray-600 bg-gray-800/50 text-gray-300 hover:border-gray-500 hover:bg-gray-700/50"
        }
      `}
      title={tool.name}
    >
      <ToolIcon icon={tool.icon} />
      <span className="text-xs mt-1 text-center leading-tight">{tool.name}</span>
    </button>
  );
}

interface ToolIconProps {
  icon: string;
}

function ToolIcon({ icon }: ToolIconProps): JSX.Element {
  // Simple icon mapping - in a real implementation, you'd use proper icon components
  const iconMap: Record<string, string> = {
    "cursor-arrow": "↖",
    wall: "▬",
    door: "▢",
    console: "⚏",
    "paint-brush": "🖌",
    square: "⬜",
    rock: "🪨",
    mountain: "⛰",
    building: "🏢",
    home: "🏠",
    "paint-brush-2": "🎨",
    layers: "📚",
  };

  return <span className="text-lg">{iconMap[icon] || "?"}</span>;
}
