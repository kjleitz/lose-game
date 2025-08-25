# ADR-0007: Landable Planets with Dual-Game Architecture

## Status

Proposed

## Context

We want to implement landable planets where players can:

1. Fly around in space (current "SpaceMode")
2. Land on planets and explore on foot (new "PlanetMode")

Both modes share similar mechanics (top-down movement, exploration) but have different:

- Entity types (ships vs. characters, space enemies vs. ground creatures)
- Physics (space drag vs. ground friction)
- Rendering (space background vs. planet surface)
- HUD elements (ship status vs. character status)

## Decision

Implement a **GameMode abstraction** that encapsulates the different game contexts while sharing common systems.

### Core Architecture

```
GameSession
├── currentMode: GameMode (SpaceMode | PlanetMode)
├── player: Player (shared entity)
└── modeStates: Map<GameModeType, GameModeState>

GameMode (abstract)
├── update(dt, actions, player, session) -> void
├── render(renderer, camera) -> void
├── getHudComponents() -> React.Component[]
└── handleModeTransition(newMode) -> GameModeState

SpaceMode extends GameMode
├── planets: Planet[]
├── enemies: Enemy[]
├── projectiles: Projectile[]
└── ai: BehaviorTree

PlanetMode extends GameMode
├── currentPlanet: Planet
├── terrain: TerrainData
├── creatures: Creature[]
└── resources: Resource[]
```

### Shared Systems

- **Player**: Single entity that works in both modes with mode-specific physics
- **Camera**: Shared camera system that follows player
- **Input**: Same input system, different action mappings per mode
- **HUD**: Modular system adapts to show mode-appropriate components
- **GameLoop**: Unchanged, delegates to active mode

### Mode Transitions

- **Landing**: Press 'L' when near planet in SpaceMode → enter PlanetMode
- **Takeoff**: Press 'T' in PlanetMode → return to SpaceMode
- **State Persistence**: Each mode saves/restores its state when switching

## Consequences

### Benefits

- Clean separation of concerns between space and planet gameplay
- Shared systems reduce duplication
- Easy to extend with additional modes (space stations, cities, etc.)
- Mode-specific optimizations possible
- Modular HUD adapts automatically

### Drawbacks

- Additional abstraction complexity
- Mode transition overhead
- Need to carefully manage shared state
- Testing complexity increases

### Implementation Strategy

1. Create GameMode abstraction
2. Refactor existing code into SpaceMode
3. Implement PlanetMode with basic terrain
4. Add mode switching UI and logic
5. Extend HUD system for mode-specific components

## Alternatives Considered

1. **Single Unified Game**: Mix space and planet logic in GameSession
   - Rejected: Would create unmaintainable spaghetti code

2. **Separate Game Instances**: Completely separate games
   - Rejected: Would duplicate too much shared logic

3. **Scene-Based Architecture**: Unity-style scenes
   - Rejected: Overkill for our current needs, mode pattern is simpler
