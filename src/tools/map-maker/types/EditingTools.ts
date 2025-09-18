export interface EditingTool {
  id: string;
  name: string;
  icon: string;
  category: "terrain" | "structure" | "objects" | "decoration" | "selection";
  cursor: "brush" | "crosshair" | "hand" | "select";
  properties: ToolProperty[];
  modes: ("ship" | "planet")[];
}

export interface ToolProperty {
  id: string;
  name: string;
  type: "number" | "string" | "boolean" | "select" | "color";
  defaultValue: unknown;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string; label: string }[];
}

export const shipTools: EditingTool[] = [
  {
    id: "select",
    name: "Select",
    icon: "cursor-arrow",
    category: "selection",
    cursor: "select",
    properties: [],
    modes: ["ship"],
  },
  {
    id: "wall",
    name: "Wall Builder",
    icon: "wall",
    category: "structure",
    cursor: "crosshair",
    properties: [
      {
        id: "thickness",
        name: "Thickness",
        type: "number",
        defaultValue: 8,
        min: 4,
        max: 16,
        step: 2,
      },
      {
        id: "wallType",
        name: "Wall Type",
        type: "select",
        defaultValue: "interior",
        options: [
          { value: "hull", label: "Hull" },
          { value: "interior", label: "Interior" },
          { value: "reinforced", label: "Reinforced" },
        ],
      },
    ],
    modes: ["ship"],
  },
  {
    id: "door",
    name: "Door Placement",
    icon: "door",
    category: "objects",
    cursor: "crosshair",
    properties: [
      {
        id: "doorType",
        name: "Door Type",
        type: "select",
        defaultValue: "sliding",
        options: [
          { value: "sliding", label: "Sliding" },
          { value: "manual", label: "Manual" },
          { value: "airlock", label: "Airlock" },
        ],
      },
      {
        id: "width",
        name: "Width",
        type: "number",
        defaultValue: 48,
        min: 16,
        max: 64,
        step: 8,
      },
    ],
    modes: ["ship"],
  },
  {
    id: "station",
    name: "Station Placement",
    icon: "console",
    category: "objects",
    cursor: "crosshair",
    properties: [
      {
        id: "stationType",
        name: "Station Type",
        type: "select",
        defaultValue: "pilot_console",
        options: [
          { value: "pilot_console", label: "Pilot Console" },
          { value: "cargo_terminal", label: "Cargo Terminal" },
          { value: "engine_controls", label: "Engine Controls" },
          { value: "navigation", label: "Navigation" },
          { value: "life_support", label: "Life Support" },
        ],
      },
      {
        id: "radius",
        name: "Interaction Radius",
        type: "number",
        defaultValue: 24,
        min: 16,
        max: 48,
        step: 4,
      },
    ],
    modes: ["ship"],
  },
  {
    id: "floor_texture",
    name: "Floor Texture",
    icon: "paint-brush",
    category: "decoration",
    cursor: "brush",
    properties: [
      {
        id: "brushSize",
        name: "Brush Size",
        type: "number",
        defaultValue: 32,
        min: 8,
        max: 64,
        step: 8,
      },
      {
        id: "pattern",
        name: "Pattern",
        type: "select",
        defaultValue: "metal",
        options: [
          { value: "metal", label: "Metal" },
          { value: "grating", label: "Grating" },
          { value: "carpet", label: "Carpet" },
          { value: "tile", label: "Tile" },
        ],
      },
    ],
    modes: ["ship"],
  },
  {
    id: "room_fill",
    name: "Room Fill",
    icon: "square",
    category: "structure",
    cursor: "select",
    properties: [
      {
        id: "roomType",
        name: "Room Type",
        type: "select",
        defaultValue: "corridor",
        options: [
          { value: "bridge", label: "Bridge" },
          { value: "quarters", label: "Quarters" },
          { value: "cargo", label: "Cargo" },
          { value: "engine", label: "Engine" },
          { value: "corridor", label: "Corridor" },
        ],
      },
      {
        id: "lightColor",
        name: "Light Color",
        type: "color",
        defaultValue: "#ffffff",
      },
      {
        id: "lightIntensity",
        name: "Light Intensity",
        type: "number",
        defaultValue: 1.0,
        min: 0.1,
        max: 2.0,
        step: 0.1,
      },
    ],
    modes: ["ship"],
  },
];

export const planetTools: EditingTool[] = [
  {
    id: "select",
    name: "Select",
    icon: "cursor-arrow",
    category: "selection",
    cursor: "select",
    properties: [],
    modes: ["planet"],
  },
  {
    id: "rock",
    name: "Rock Placement",
    icon: "rock",
    category: "objects",
    cursor: "crosshair",
    properties: [
      {
        id: "size",
        name: "Size",
        type: "number",
        defaultValue: 16,
        min: 8,
        max: 64,
        step: 4,
      },
      {
        id: "rockType",
        name: "Rock Type",
        type: "select",
        defaultValue: "boulder",
        options: [
          { value: "boulder", label: "Boulder" },
          { value: "outcrop", label: "Outcrop" },
          { value: "pebbles", label: "Pebbles" },
        ],
      },
    ],
    modes: ["planet"],
  },
  {
    id: "hill",
    name: "Hill Builder",
    icon: "mountain",
    category: "terrain",
    cursor: "brush",
    properties: [
      {
        id: "brushSize",
        name: "Brush Size",
        type: "number",
        defaultValue: 64,
        min: 16,
        max: 128,
        step: 8,
      },
      {
        id: "strength",
        name: "Strength",
        type: "number",
        defaultValue: 0.5,
        min: 0.1,
        max: 2.0,
        step: 0.1,
      },
      {
        id: "mode",
        name: "Mode",
        type: "select",
        defaultValue: "raise",
        options: [
          { value: "raise", label: "Raise" },
          { value: "lower", label: "Lower" },
          { value: "smooth", label: "Smooth" },
        ],
      },
    ],
    modes: ["planet"],
  },
  {
    id: "structure",
    name: "Structure Creator",
    icon: "building",
    category: "objects",
    cursor: "crosshair",
    properties: [
      {
        id: "structureType",
        name: "Structure Type",
        type: "select",
        defaultValue: "outpost",
        options: [
          { value: "outpost", label: "Outpost" },
          { value: "beacon", label: "Beacon" },
          { value: "ruins", label: "Ruins" },
          { value: "monument", label: "Monument" },
        ],
      },
      {
        id: "size",
        name: "Size",
        type: "number",
        defaultValue: 32,
        min: 16,
        max: 128,
        step: 8,
      },
    ],
    modes: ["planet"],
  },
  {
    id: "village",
    name: "Village Builder",
    icon: "home",
    category: "objects",
    cursor: "crosshair",
    properties: [
      {
        id: "population",
        name: "Population",
        type: "number",
        defaultValue: 50,
        min: 10,
        max: 200,
        step: 10,
      },
      {
        id: "buildingDensity",
        name: "Building Density",
        type: "number",
        defaultValue: 0.7,
        min: 0.3,
        max: 1.0,
        step: 0.1,
      },
    ],
    modes: ["planet"],
  },
  {
    id: "biome",
    name: "Biome Painter",
    icon: "paint-brush-2",
    category: "terrain",
    cursor: "brush",
    properties: [
      {
        id: "brushSize",
        name: "Brush Size",
        type: "number",
        defaultValue: 48,
        min: 16,
        max: 128,
        step: 8,
      },
      {
        id: "biomeType",
        name: "Biome Type",
        type: "select",
        defaultValue: "fields",
        options: [
          { value: "rainforest", label: "Rainforest" },
          { value: "fields", label: "Fields" },
          { value: "desert", label: "Desert" },
          { value: "archipelago", label: "Archipelago" },
        ],
      },
      {
        id: "opacity",
        name: "Opacity",
        type: "number",
        defaultValue: 1.0,
        min: 0.1,
        max: 1.0,
        step: 0.1,
      },
    ],
    modes: ["planet"],
  },
  {
    id: "terrain_height",
    name: "Terrain Height",
    icon: "layers",
    category: "terrain",
    cursor: "brush",
    properties: [
      {
        id: "brushSize",
        name: "Brush Size",
        type: "number",
        defaultValue: 32,
        min: 8,
        max: 128,
        step: 8,
      },
      {
        id: "strength",
        name: "Strength",
        type: "number",
        defaultValue: 0.3,
        min: 0.1,
        max: 1.0,
        step: 0.1,
      },
      {
        id: "mode",
        name: "Mode",
        type: "select",
        defaultValue: "raise",
        options: [
          { value: "raise", label: "Raise" },
          { value: "lower", label: "Lower" },
          { value: "flatten", label: "Flatten" },
        ],
      },
    ],
    modes: ["planet"],
  },
];

export function getToolsForMode(mode: "ship" | "planet"): EditingTool[] {
  return mode === "ship" ? shipTools : planetTools;
}

export function getToolById(toolId: string, mode: "ship" | "planet"): EditingTool | undefined {
  return getToolsForMode(mode).find((tool) => tool.id === toolId);
}
