# ADR-001: Map Maker Tool Architecture

## Status

Proposed

## Context

L.O.S.E. currently generates planet surfaces and ship interiors procedurally. To enable user-created content and more diverse gameplay experiences, we need a map-maker tool that allows players to design:

1. **Planet Surfaces**: Custom terrain, resource placement, biome configuration
2. **Ship Interiors**: Room layouts, wall placement, door configuration, interactive station placement

The map-maker must be decoupled enough to develop independently while integrating seamlessly with the existing game systems.

## Decision

We will implement a unified map-maker tool with the following architecture:

### Core Structure

```
src/
├── tools/
│   └── map-maker/
│       ├── MapMaker.tsx              # Main map-maker component
│       ├── MapMakerEngine.ts         # Core editing engine
│       ├── types/
│       │   ├── MapProject.ts         # Project file format
│       │   └── EditingTools.ts       # Tool definitions
│       ├── canvas/
│       │   ├── MapCanvas.tsx         # Editing canvas component
│       │   ├── GridRenderer.ts       # Grid and guides
│       │   └── PreviewRenderer.ts    # Real-time preview
│       ├── panels/
│       │   ├── ToolPanel.tsx         # Tool selection (brush, wall, door)
│       │   ├── LayerPanel.tsx        # Layer management
│       │   ├── PropertyPanel.tsx     # Object properties
│       │   └── AssetPanel.tsx        # Asset library
│       └── modes/
│           ├── PlanetEditor.tsx      # Planet surface editing
│           └── ShipEditor.tsx        # Ship interior editing
```

### Map Project Format

```typescript
interface MapProject {
  version: string;
  type: "planet" | "ship";
  metadata: {
    name: string;
    author: string;
    created: string;
    modified: string;
  };
  planet?: PlanetSurfaceProject;
  ship?: ShipInteriorProject;
}

interface PlanetSurfaceProject extends PlanetSurface {
  layers: {
    terrain: TerrainLayer;
    biomes: BiomeLayer;
    resources: ResourceLayer;
    decorations: DecorationLayer;
  };
}

interface ShipInteriorProject extends ShipInterior {
  layers: {
    structure: StructureLayer; // walls, hull
    rooms: RoomLayer;
    objects: ObjectLayer; // doors, stations
    lighting: LightingLayer;
  };
}
```

### Editing Tools System

```typescript
interface EditingTool {
  id: string;
  name: string;
  icon: string;
  category: "terrain" | "structure" | "objects" | "decoration" | "selection";
  cursor: "brush" | "crosshair" | "hand" | "select";
  properties: ToolProperty[];
  modes: ("ship" | "planet")[];
}

// Ship Interior Tools
const shipTools: EditingTool[] = [
  { id: "select", name: "Select", category: "selection", cursor: "select" },
  { id: "wall", name: "Wall Builder", category: "structure", cursor: "crosshair" },
  { id: "door", name: "Door Placement", category: "objects", cursor: "crosshair" },
  { id: "station", name: "Station Placement", category: "objects", cursor: "crosshair" },
  { id: "floor_texture", name: "Floor Texture", category: "decoration", cursor: "brush" },
  { id: "room_fill", name: "Room Fill", category: "structure", cursor: "select" },
];

// Planet Surface Tools
const planetTools: EditingTool[] = [
  { id: "select", name: "Select", category: "selection", cursor: "select" },
  { id: "rock", name: "Rock Placement", category: "objects", cursor: "crosshair" },
  { id: "hill", name: "Hill Builder", category: "terrain", cursor: "brush" },
  { id: "structure", name: "Structure Creator", category: "objects", cursor: "crosshair" },
  { id: "village", name: "Village Builder", category: "objects", cursor: "crosshair" },
  { id: "biome", name: "Biome Painter", category: "terrain", cursor: "brush" },
  { id: "terrain_height", name: "Terrain Height", category: "terrain", cursor: "brush" },
];
```

### Integration Points

#### Reused Domain Types

- `PlanetSurface` from `src/domain/game/planet-surface/types.ts`
- `ShipInterior`, `Wall`, `Door`, `InteractiveStation` from `src/domain/game/ship-interior/types.ts`
- `Biome` types from `src/shared/types/Biome.ts`

#### Export/Import System

- **Storage**: Maps saved to browser storage with project management
- **Export**: Export maps as `.losemap.json` files for external use
- **Import**: Load maps from storage for continued editing
- **Game Integration**: Place exported `.losemap.json` files in `assets/maps/` directory for in-game use
- **File Management**: Save/Load/Export buttons with project browser
- **Validation**: Maps validated against game constraints before export

#### Game Integration

```typescript
// In GameSessionECS - extend planet loading
private loadCustomPlanet(mapFile: MapProject): PlanetSurface {
  if (mapFile.type !== "planet") throw new Error("Invalid map type");
  return validateAndConvertPlanetProject(mapFile.planet);
}

// Extend ship interior generation
private loadCustomShipInterior(mapFile: MapProject): ShipInterior {
  if (mapFile.type !== "ship") throw new Error("Invalid map type");
  return validateAndConvertShipProject(mapFile.ship);
}
```

### Core Features

#### Mouse-Based Editing

- **Wall Drawing**: Click and drag to draw walls, automatic snapping to grid
- **Door Placement**: Click to place doors along walls with automatic orientation
- **Object Placement**: Click to place stations, rocks, structures, villages
- **Brush Tools**: Click and drag for terrain height, biome painting, floor textures
- **Selection Tool**: Click to select objects, drag to move, delete key to remove

#### Automatic Room Detection

- **Closed Space Analysis**: Automatically detect enclosed areas formed by walls
- **Room Creation**: Generate `Room` objects for detected closed spaces
- **Floor Fill**: Apply floor textures to detected rooms
- **Room Properties**: Set room type, lighting, name for detected spaces

#### Mode Switching

- **Ship/Planet Toggle**: Toggle between ship interior and planet surface modes
- **Tool Filtering**: Show only relevant tools for current mode
- **Canvas Adaptation**: Different grid sizes and coordinate systems per mode
- **Preview Rendering**: Mode-appropriate rendering and visualization

#### File Management

- **Browser Storage**: Save projects to `localStorage` with project list
- **Save Button**: Save current project with name and metadata
- **Load Button**: Browse and load existing projects from storage
- **Export Button**: Export project as `.losemap.json` file for download
- **Auto-save**: Periodic saves with conflict resolution

### Implementation Phases

#### Phase 1: Core Infrastructure & Ship Editor

- `MapMakerEngine` with canvas management
- Tool system with ship interior tools (wall, door, station, select)
- Mouse-based wall drawing with grid snapping
- Door placement along walls
- Basic room detection algorithm

#### Phase 2: Advanced Ship Features

- Interactive station placement with type selection
- Floor texture painting
- Automatic room filling and properties
- Save/Load functionality with browser storage

#### Phase 3: Planet Surface Editor

- Mode switching between ship and planet
- Planet tools (rock, hill, structure, village, biome)
- Terrain height brush painting
- Biome selection and painting

#### Phase 4: File Management & Export

- Export to `.losemap.json` files
- Project browser and management UI
- Integration with game asset loading
- Map validation system

#### Phase 5: Polish & Integration

- Undo/redo system
- Copy/paste functionality
- Performance optimization
- In-game custom map loading

## Technical Considerations

### Coordinate Systems

- **Planet Editor**: Uses existing planet-local coordinates (-radius to +radius)
- **Ship Editor**: Uses ship-local coordinates matching `ShipInterior` bounds
- **Grid System**: Configurable snap grid (16px for ships, larger for planets)

### Room Detection Algorithm

```typescript
interface RoomDetector {
  detectRooms(walls: Wall[]): DetectedRoom[];
  floodFill(startX: number, startY: number, walls: Wall[]): Point2D[];
  isEnclosed(area: Point2D[], walls: Wall[]): boolean;
}

// Algorithm:
// 1. Create wall collision grid
// 2. Flood fill from empty spaces
// 3. Identify enclosed regions
// 4. Generate Room objects for valid enclosed areas
// 5. Allow manual room property editing
```

### Validation Rules

- **Planets**: Landing site accessibility, resource balance, terrain constraints, biome coherence
- **Ships**: Room connectivity validation, door placement on walls only, station reachability, hull integrity
- **Export**: Ensure all required fields present, coordinate bounds checking, object overlap detection

### Performance

- **Canvas Rendering**: Separate from game canvas, optimized for editing operations
- **Undo/Redo**: Command pattern with operation history
- **Auto-save**: Periodic project saves with conflict resolution

### UI/UX Guidelines

- Follows existing HUD styling (`hud-panel`, `hud-text` classes)
- Keyboard shortcuts for power users
- Context-sensitive right-click menus
- Tool-specific cursors and visual feedback

## Consequences

### Positive

- **Decoupled Development**: Can develop map-maker independently
- **Content Creation**: Enables user-generated content
- **Reusable Components**: Map-maker components can be reused for other tools
- **Type Safety**: Full TypeScript integration with existing domain types

### Negative

- **Complexity**: Additional codebase to maintain
- **File Format**: Need to version and migrate map project files
- **Validation**: Complex validation rules for playable maps
- **Performance**: Additional rendering and memory overhead

### Risks

- **Type Drift**: Map project types must stay synchronized with game types
- **File Compatibility**: Breaking changes in domain types affect saved maps
- **User Experience**: Complex tool requires good UX design

## Alternatives Considered

1. **External Tool**: Separate application - rejected due to integration complexity
2. **Simple JSON Editor**: Manual editing - rejected due to poor UX
3. **Game-Embedded Only**: No standalone mode - rejected due to development friction

## References

- Existing `PlanetSurface` implementation: `src/domain/game/planet-surface/`
- Ship interior system: `src/domain/game/ship-interior/`
- UI patterns: `src/ui/controls/` and `src/ui/hud/`
- Project structure guidelines: `RULES.md`
