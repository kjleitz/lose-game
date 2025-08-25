# Dual-Game System Architecture

## Overview

L.O.S.E. implements a dual-game architecture where **SpaceMode** and **PlanetMode** operate as distinct games sharing a common engine. This allows each mode to have unique gameplay mechanics, visuals, and systems while maintaining seamless transitions between them.

## Core Philosophy

> **Each mode should feel like a separate game that happens to share an engine with the other mode.**

This means:

- **Minimal coupling** between modes
- **Independent evolution** of gameplay mechanics
- **Mode-specific** features, UI, and systems
- **Shared engine** for common functionality (rendering, input, physics)

## Current Implementation

### Mode Switching Flow

```
Space Mode (Ship) ─── [Press L near planet] ───> Planet Mode (Character)
      ^                                                      |
      └─────────────── [Press T] ─────────────────────────────┘
```

### Key Files & Locations

#### Core Mode System

- `src/domain/game/modes/GameMode.ts` - Abstract base class for all modes
- `src/domain/game/modes/SpaceMode.ts` - Space exploration gameplay
- `src/domain/game/modes/PlanetMode.ts` - Planet surface exploration
- `src/domain/game/modes/ModeTransition.ts` - State management for mode switches

#### Mode-Specific Rendering

- `src/domain/render/GameRenderer.ts` - Mode-aware master renderer
- `src/domain/render/PlanetSurfaceRenderer.ts` - Planet terrain rendering
- `src/domain/render/CharacterRenderer.ts` - Character sprite for planet mode
- `src/domain/render/ShipRenderer.ts` - Spaceship sprite for space mode

#### Shared Systems

- `src/domain/game/GameSession.ts` - Mode manager and coordinator
- `src/domain/game/player.ts` - Player entity with mode-specific physics
- `src/ui/components/CanvasRenderer.tsx` - Canvas management
- `src/application/game/input.ts` - Input system with mode-aware actions

## Future Architecture Vision

### Proposed Directory Structure

```
src/
├── engine/                     # Shared engine systems
│   ├── core/
│   │   ├── GameLoop.ts
│   │   ├── Camera.ts
│   │   ├── Input.ts
│   │   └── Physics.ts
│   ├── rendering/
│   │   ├── Renderer.ts
│   │   ├── Canvas.ts
│   │   ├── Sprites.ts
│   │   └── Effects.ts
│   ├── audio/
│   │   ├── AudioManager.ts
│   │   └── SoundEffects.ts
│   ├── networking/
│   │   └── MultiplayerSync.ts
│   └── ui/
│       ├── HudSystem.ts
│       ├── Menu.ts
│       └── Notifications.ts
├── games/                      # Mode-specific game implementations
│   ├── space/                  # Space exploration game
│   │   ├── SpaceGame.ts
│   │   ├── entities/
│   │   │   ├── Spaceship.ts
│   │   │   ├── Planet.ts
│   │   │   ├── Enemy.ts
│   │   │   └── Projectile.ts
│   │   ├── systems/
│   │   │   ├── Combat.ts
│   │   │   ├── Navigation.ts
│   │   │   ├── AI.ts
│   │   │   └── PlanetGeneration.ts
│   │   ├── rendering/
│   │   │   ├── SpaceRenderer.ts
│   │   │   ├── StarfieldRenderer.ts
│   │   │   ├── PlanetRenderer.ts
│   │   │   └── ShipRenderer.ts
│   │   ├── ui/
│   │   │   ├── SpaceHud.tsx
│   │   │   ├── NavigationPanel.tsx
│   │   │   └── ShipStatus.tsx
│   │   └── config/
│   │       ├── spaceConfig.ts
│   │       ├── shipStats.ts
│   │       └── enemyTypes.ts
│   └── planet/                 # Planet exploration game
│       ├── PlanetGame.ts
│       ├── entities/
│       │   ├── Character.ts
│       │   ├── Creature.ts
│       │   ├── Resource.ts
│       │   └── Structure.ts
│       ├── systems/
│       │   ├── Exploration.ts
│       │   ├── Crafting.ts
│       │   ├── CreatureAI.ts
│       │   └── TerrainGeneration.ts
│       ├── rendering/
│       │   ├── PlanetRenderer.ts
│       │   ├── TerrainRenderer.ts
│       │   ├── CharacterRenderer.ts
│       │   └── EnvironmentRenderer.ts
│       ├── ui/
│       │   ├── PlanetHud.tsx
│       │   ├── InventoryPanel.tsx
│       │   └── CraftingInterface.tsx
│       └── config/
│           ├── planetConfig.ts
│           ├── creatureTypes.ts
│           └── resources.ts
├── shared/                     # Cross-game utilities and types
│   ├── types/
│   │   ├── GameMode.ts
│   │   ├── Player.ts
│   │   └── Common.ts
│   ├── utils/
│   │   ├── math.ts
│   │   ├── random.ts
│   │   └── serialization.ts
│   └── constants/
│       ├── gameConstants.ts
│       └── keyBindings.ts
└── application/                # Application layer
    ├── GameManager.ts          # Orchestrates mode switching
    ├── SaveSystem.ts
    └── Settings.ts
```

### Engine Abstraction Goals

#### 1. Core Engine Services

```typescript
// Engine interfaces that both games implement
interface GameEngine {
  input: InputManager;
  renderer: RenderingEngine;
  audio: AudioManager;
  camera: CameraSystem;
  physics: PhysicsEngine;
  ui: UIManager;
}

// Each game mode gets its own engine instance
const spaceEngine = createEngine(SpaceGameConfig);
const planetEngine = createEngine(PlanetGameConfig);
```

#### 2. Mode-Specific Configs

```typescript
// Space game configuration
const SpaceGameConfig = {
  physics: {
    dragCoefficient: 0.98,
    thrustForce: 280,
  },
  rendering: {
    backgroundColor: "#000",
    enableStarfield: true,
  },
  entities: [Ship, Planet, Enemy, Projectile],
  systems: [CombatSystem, NavigationSystem, AISystem],
};

// Planet game configuration
const PlanetGameConfig = {
  physics: {
    friction: 0.85,
    walkSpeed: 200,
  },
  rendering: {
    backgroundColor: "#8B4513",
    enableTerrain: true,
  },
  entities: [Character, Creature, Resource, Structure],
  systems: [ExplorationSystem, CraftingSystem, CreatureAI],
};
```

#### 3. Independent Feature Development

Each game mode should be able to add features independently:

**Space Game Features:**

- Ship upgrades and customization
- Space stations and trading
- Fleet combat
- Wormholes and fast travel
- Mining asteroids

**Planet Game Features:**

- Base building and settlements
- Farming and terraforming
- Underground cave systems
- Weather and day/night cycles
- Vehicle construction

## Implementation Roadmap

### Phase 1: Engine Extraction (Current → Future)

- [ ] Extract shared systems to `engine/` directory
- [ ] Create `GameEngine` interface and factory
- [ ] Refactor `GameSession` to use engine abstraction
- [ ] Move mode-specific code to `games/` directories

### Phase 2: Mode Independence

- [ ] Separate configuration systems
- [ ] Independent entity systems per mode
- [ ] Mode-specific UI frameworks
- [ ] Isolated save/load systems

### Phase 3: Advanced Features

- [ ] Plugin system for mode-specific features
- [ ] Hot-swapping of game modes
- [ ] Shared asset pipeline
- [ ] Mode-specific testing frameworks

### Phase 4: Developer Experience

- [ ] Mode-specific development tools
- [ ] Separate build pipelines per mode
- [ ] Independent feature flags
- [ ] Mode-specific performance profiling

## Developer Guidelines

### Adding New Features

#### To Space Mode:

1. Add entities to `games/space/entities/`
2. Add systems to `games/space/systems/`
3. Add rendering to `games/space/rendering/`
4. Update `games/space/SpaceGame.ts`
5. Add UI to `games/space/ui/`

#### To Planet Mode:

1. Add entities to `games/planet/entities/`
2. Add systems to `games/planet/systems/`
3. Add rendering to `games/planet/rendering/`
4. Update `games/planet/PlanetGame.ts`
5. Add UI to `games/planet/ui/`

#### To Shared Engine:

1. Add core functionality to `engine/core/`
2. Create interfaces in `shared/types/`
3. Update both game configurations
4. Add tests to `engine/tests/`

### Mode Coupling Rules

#### ✅ **Allowed Coupling**

- Shared player entity (with mode-specific behaviors)
- Common input system (with mode-specific bindings)
- Transition data passing (position, basic state)
- Engine services (rendering, audio, physics)

#### ❌ **Forbidden Coupling**

- Direct imports between game modes
- Shared gameplay logic (combat, exploration, etc.)
- Mode-specific UI components in other modes
- Hardcoded assumptions about other modes

### Testing Strategy

```typescript
// Mode-specific test suites
describe("Space Game", () => {
  // Test space-specific features
});

describe("Planet Game", () => {
  // Test planet-specific features
});

describe("Game Engine", () => {
  // Test shared engine functionality
});

describe("Mode Transitions", () => {
  // Test transitions between modes
});
```

## Benefits of This Architecture

### For Developers

- **Clear boundaries**: Know exactly where to add features
- **Independent development**: Work on modes without conflicts
- **Easier testing**: Test modes in isolation
- **Better performance**: Load only needed systems per mode

### For Players

- **Distinct experiences**: Each mode feels like its own game
- **Optimized performance**: Each mode runs its own optimized systems
- **Rich features**: Modes can have deep, specialized mechanics
- **Seamless transitions**: Shared engine ensures smooth mode switching

### For the Project

- **Maintainability**: Clear separation of concerns
- **Scalability**: Easy to add new modes (cities, space stations, etc.)
- **Modularity**: Can ship modes independently
- **Extensibility**: Plugin system for community content

## Migration Path

### Current State Assessment

- ✅ Basic mode switching implemented
- ✅ Mode-specific rendering working
- ✅ Player physics adaptation complete
- ⚠️ Shared systems still coupled to GameSession
- ⚠️ No clear boundaries between mode code
- ❌ No engine abstraction layer

### Next Steps

1. **Document current coupling points** - Audit all cross-mode dependencies
2. **Create engine interfaces** - Define the contract between engine and games
3. **Extract first engine service** - Start with rendering or input system
4. **Refactor one mode completely** - Move SpaceMode to new structure
5. **Iterate and improve** - Apply lessons learned to other modes

This architecture will transform L.O.S.E. from a single game with modes into a true dual-game system where each mode can evolve independently while sharing a powerful common engine.
