# Landable Planets Design

Implementation guide for the dual-game architecture supporting landable planets.

## Overview

L.O.S.E. supports two gameplay modes implemented under a single ECS session:

- Space: ship-based space exploration
- Planet: on-foot exploration of planet surfaces

Both modes share core systems (ECS components/systems) while maintaining clean separation for mode-specific logic.

## Architecture

### Implementation Pattern (historical)

```typescript
abstract class GameMode {
  abstract update(dt: number, actions: Set<string>, player: Player, session: GameSession): void;
  abstract render(renderer: GameRenderer, camera: Camera): void;
  abstract getHudComponents(): React.ComponentType[];
  abstract handleTransition(newMode: GameModeType): GameModeState;
  abstract canTransition(newMode: GameModeType): boolean;
}
```

### Mode State Management (now handled by ECS session)

Each mode maintains its own state that persists when switching:

```typescript
interface SpaceModeState {
  planets: Planet[];
  enemies: Enemy[];
  projectiles: Projectile[];
  aiBlackboards: Map<string, Blackboard>;
}

interface PlanetModeState {
  currentPlanet: Planet;
  terrain: TerrainData;
  creatures: Creature[];
  resources: Resource[];
  playerPosition: { x: number; y: number };
}
```

### Player Entity Evolution

The Player class adapts to different modes:

```typescript
class Player {
  state: PlayerState;
  mode: "space" | "planet" = "space";

  updateSpace(dt: number, actions: Set<string>): void {
    // Ship physics: thrust, rotation, space drag
  }

  updatePlanet(dt: number, actions: Set<string>): void {
    // Character physics: walking, ground friction, collision
  }
}
```

## Mode Transitions (now in GameSessionECS)

### Landing on Planets

**Trigger**: Press 'L' key when within landing range of a planet
**Process**:

1. Save current space state
2. Generate planet surface terrain
3. Position player at landing site
4. Switch to planet mode
5. Update HUD to show planet-specific UI

### Taking Off

**Trigger**: Press 'T' key while on planet surface
**Process**:

1. Save current planet state
2. Restore SpaceMode state
3. Position ship outside planet in space
4. Switch to space mode
5. Update HUD to show space-specific UI

## Shared Systems

### Camera System

- Same camera follows player in both modes
- Mode-specific zoom levels and constraints
- Smooth transitions during mode switches

### Input System

- Core input handling unchanged
- Mode-specific action mappings:
  - Space: thrust, turn, fire, land
  - Planet: walk, run, interact, takeoff

### HUD System

- Modular design adapts to active mode
- Shared components: health, experience, settings
- Mode-specific: ship status vs. character inventory

### Rendering Pipeline

- `GameRenderer` queries `GameSessionECS` for the current mode and delegates to space/planet render passes.

## Implementation Phases

### Phase 1: Core Architecture

- [ ] Create GameMode abstraction
- [ ] Implement SpaceMode (refactor existing logic)
- [ ] Update GameSession for mode management
- [ ] Add basic mode switching

### Phase 2: Planet Mode Foundation

- [ ] Implement PlanetMode class
- [ ] Basic terrain generation system
- [ ] Player character movement on planets
- [ ] Planet surface renderer

### Phase 3: Mode Transitions

- [ ] Landing interaction system
- [ ] Takeoff interaction system
- [ ] State persistence between modes
- [ ] Smooth camera transitions

### Phase 4: Planet Content

- [ ] Terrain features (rocks, vegetation)
- [ ] Planet creatures and AI
- [ ] Collectible resources
- [ ] Planet-specific objectives

### Phase 5: Polish

- [ ] Mode-specific HUD components
- [ ] Audio system integration
- [ ] Performance optimizations
- [ ] Extended testing

## Technical Considerations

### Performance

- Only render active mode entities
- Efficient state serialization for mode switching
- Terrain generation on-demand
- Level-of-detail for large planets

### Testing Strategy

- Unit tests for each GameMode implementation
- Integration tests for mode transitions
- E2E tests covering full land→explore→takeoff cycle
- Performance benchmarks for mode switching

### Extensibility

- Easy to add new modes (space stations, cities)
- Plugin system for mode-specific features
- Modular HUD allows mode-specific UI components
- Shared systems support multiple entity types

## File Organization (historical; classes removed)

```
src/domain/game/
├── modes/
│   ├── (removed) GameMode.ts
│   ├── (removed) SpaceMode.ts
│   ├── (removed) PlanetMode.ts
│   └── (removed) ModeTransition.ts
├── terrain/
│   ├── TerrainGenerator.ts  # Procedural planet surfaces
│   └── TerrainRenderer.ts   # Planet surface rendering
└── GameSession.ts           # Updated for mode management

src/ui/hud/
├── modes/
│   ├── SpaceHud.tsx         # Space-specific UI
│   └── PlanetHud.tsx        # Planet-specific UI
```

This architecture maintains the game's current strengths while cleanly adding the complexity needed for dual-mode gameplay.
