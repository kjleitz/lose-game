# Map Maker

A visual editor for creating ship interiors and planet surfaces in L.O.S.E. The map maker provides an HTML5 canvas-based interface for designing game environments with multiple tools, layers, and project management.

## Core Architecture

### Main Components

- **MapMaker.tsx**: Main UI component that orchestrates the entire editor interface
- **MapMakerEngine.ts**: Core logic engine handling canvas interactions, tool state, and event management
- **MapCanvas.tsx**: React wrapper for the HTML5 canvas rendering surface

### Project Structure

Projects are stored in the `MapProject` format with metadata, versioning, and support for both ship and planet editing modes. Each project contains:

- Ship interiors: walls, doors, stations, rooms, lighting layers
- Planet surfaces: terrain, biomes, resources, decoration layers

## Tool System

### Available Tools

**Ship Mode:**

- Select: Feature selection and manipulation
- Wall Builder: Interior/hull/reinforced wall creation
- Door Placement: Sliding/manual/airlock doors
- Station Placement: Interactive ship consoles and terminals
- Floor Texture: Surface decoration painting
- Room Fill: Automatic room detection and properties

**Planet Mode:**

- Select: Feature selection and manipulation
- Rock Placement: Boulder/outcrop/pebble placement
- Hill Builder: Terrain elevation sculpting
- Structure Creator: Outpost/beacon/ruins placement
- Village Builder: Settlement generation
- Biome Painter: Biome area painting
- Terrain Height: Direct height map editing

### Tool Properties

Each tool exposes configurable properties (size, strength, type, color) through the property panel. Tools use type-safe property definitions with validation ranges.

## Canvas System

### Rendering Components

- **GridRenderer.ts**: Background grid and snap-to-grid visual feedback
- **PreviewRenderer.ts**: Real-time tool preview overlays
- **MapCanvas.tsx**: Main rendering orchestration

### Camera & Navigation

- Pan: Click-drag to move viewport
- Zoom: Mouse wheel with center-point preservation
- Grid snapping: Configurable snap-to-grid for precise placement

## Layer Management

### Ship Layers

- Structure: walls and hull
- Objects: doors, stations, furniture
- Rooms: auto-detected or manual room boundaries
- Lighting: ambient levels and point lights

### Planet Layers

- Terrain: height maps and geological features
- Biomes: painted biome areas with opacity blending
- Resources: resource deposits and harvestable materials
- Decorations: aesthetic elements and landmarks

Layers support visibility toggling, opacity adjustment, and reordering.

## State Management

### History System

- Undo/redo with 50-action stack depth
- Action types: add, remove, modify, move
- Automatic history clearing on mode switches

### Clipboard Operations

- Copy/paste selected features
- Cross-session clipboard persistence
- Mode-aware pasting (ship vs planet compatibility)

## Key Features

### Multi-Mode Support

Switch between ship interior and planet surface editing with appropriate tool sets and default projects for each mode.

### Project Persistence

- localStorage auto-save with project naming
- JSON export/import (.losemap files)
- Metadata tracking (creation date, author, modifications)

### Performance Optimizations

- Viewport culling for large maps
- Render throttling at 60fps
- Feature selection batching
- Camera transform caching

## File Organization

```
map-maker/
├── MapMaker.tsx           # Main UI component
├── MapMakerEngine.ts      # Core logic engine
├── canvas/                # Rendering system
│   ├── MapCanvas.tsx      # Canvas React wrapper
│   ├── GridRenderer.ts    # Grid rendering
│   └── PreviewRenderer.ts # Tool previews
├── panels/                # UI panels
│   ├── ToolPanel.tsx      # Tool selection
│   ├── PropertyPanel.tsx  # Tool properties
│   └── LayerPanel.tsx     # Layer management
├── modes/                 # Mode-specific editors
│   ├── ShipEditor.tsx     # Ship interior editing
│   └── PlanetEditor.tsx   # Planet surface editing
├── tools/                 # Tool implementations
│   ├── SelectionTool.ts   # Feature selection
│   ├── WallDrawingTool.ts # Wall creation
│   ├── DoorPlacementTool.ts # Door placement
│   └── RoomDetector.ts    # Automatic room detection
└── types/                 # Type definitions
    ├── MapProject.ts      # Project data structures
    └── EditingTools.ts    # Tool definitions
```

## Integration Points

The map maker integrates with the game's domain types for ship interiors (`ShipInterior`) and planet surfaces (`PlanetSurface`), extending them with layer-based editing capabilities. Projects can be exported for direct use in the game engine.
