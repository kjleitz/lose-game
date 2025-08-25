# Newcomer's Guide to L.O.S.E. Dual-Game Architecture

Welcome to L.O.S.E. (Lots of Outer Space to Explore)! This guide will help you understand our unique dual-game architecture and how to contribute effectively.

## What Makes L.O.S.E. Different?

L.O.S.E. isn't just one game—it's **two distinct games that share a common engine**:

1. **Space Game**: Top-down space exploration with ships, combat, and planets
2. **Planet Game**: Character-based surface exploration with creatures, resources, and terrain

Players seamlessly transition between these modes by landing on planets (`L` key) and taking off (`T` key).

## Quick Start: Understanding the Codebase

### 🎮 Current Game Modes

#### Space Mode (`src/domain/game/modes/SpaceMode.ts`)

- **What**: Ship-based space exploration
- **Entities**: Spaceship, Planets, Enemies, Projectiles
- **Controls**: WASD (thrust/turn), Space (fire), L (land)
- **Physics**: Space drag, momentum-based movement
- **Visuals**: Starfield, planets, ship sprite

#### Planet Mode (`src/domain/game/modes/PlanetMode.ts`)

- **What**: Character-based planet surface exploration
- **Entities**: Character, Creatures, Resources, Terrain
- **Controls**: WASD (walk), Shift (run), T (takeoff)
- **Physics**: Ground friction, direct movement
- **Visuals**: Planet surface, character sprite, terrain features

### 🏗️ Key Architecture Files

| File              | Purpose                               | When to Edit                                   |
| ----------------- | ------------------------------------- | ---------------------------------------------- |
| `GameSession.ts`  | Mode coordinator & transition manager | Adding new modes or transition logic           |
| `GameMode.ts`     | Abstract base for all game modes      | Changing core mode interface                   |
| `SpaceMode.ts`    | Space game implementation             | Adding space-specific features                 |
| `PlanetMode.ts`   | Planet game implementation            | Adding planet-specific features                |
| `GameRenderer.ts` | Mode-aware rendering system           | Adding new rendering modes                     |
| `Player.ts`       | Shared player entity                  | Adding player mechanics that work across modes |

### 🎨 Rendering System

```
GameRenderer (master)
├── Space Mode
│   ├── StarfieldRenderer
│   ├── PlanetRenderer
│   ├── ShipRenderer
│   └── EnemyRenderer
└── Planet Mode
    ├── PlanetSurfaceRenderer
    ├── CharacterRenderer
    └── [Future: CreatureRenderer, TerrainRenderer]
```

## How to Add Features

### 🚀 Adding Space Game Features

**Example**: Adding asteroid mining

1. **Entity**: Create `Asteroid.ts` in `src/domain/game/`
2. **Rendering**: Add asteroid rendering to space renderers
3. **Logic**: Add mining system to `SpaceMode.ts`
4. **UI**: Add mining UI to space-specific HUD components
5. **Input**: Add mining controls to input system

```typescript
// In SpaceMode.ts
private asteroids: Asteroid[] = [];

update(dt: number, actions: Set<string>, player: Player, session: GameSession) {
  // Handle mining action
  if (actions.has("mine")) {
    this.handleMining(player);
  }

  // Update asteroids
  this.updateAsteroids(dt);
}
```

### 🪐 Adding Planet Game Features

**Example**: Adding base building

1. **Entity**: Create `Structure.ts` in `src/domain/game/modes/PlanetMode.ts`
2. **Rendering**: Add structure rendering to `PlanetSurfaceRenderer.ts`
3. **Logic**: Add building system to `PlanetMode.ts`
4. **UI**: Create building interface components
5. **Input**: Add building controls (separate from space controls)

```typescript
// In PlanetMode.ts
private structures: Structure[] = [];

update(dt: number, actions: Set<string>, player: Player, session: GameSession) {
  // Handle building action
  if (actions.has("build")) {
    this.handleBuilding(player);
  }

  // Update structures
  this.updateStructures(dt);
}
```

### 🔧 Adding Shared Engine Features

**Example**: Adding audio system

1. **Engine**: Create `AudioManager.ts` in `src/domain/` or future `src/engine/`
2. **Integration**: Add audio to both SpaceMode and PlanetMode
3. **Configuration**: Allow mode-specific audio settings
4. **Testing**: Test audio works in both modes

## Development Rules & Best Practices

### ✅ **DO** - Good Practices

```typescript
// ✅ Mode-specific entities and logic
class SpaceMode extends GameMode {
  private spaceStations: SpaceStation[] = [];
  private wormholes: Wormhole[] = [];
}

class PlanetMode extends GameMode {
  private settlements: Settlement[] = [];
  private weather: WeatherSystem;
}

// ✅ Shared engine services
class AudioManager {
  playSpaceMusic() {
    /* */
  }
  playPlanetAmbience() {
    /* */
  }
}

// ✅ Mode-aware rendering
if (mode === "space") {
  this.renderSpaceMode();
} else if (mode === "planet") {
  this.renderPlanetMode();
}
```

### ❌ **DON'T** - Anti-Patterns

```typescript
// ❌ Cross-mode dependencies
import { SpaceMode } from "./SpaceMode"; // in PlanetMode.ts

// ❌ Hardcoded mode assumptions
if (player.hasSpaceship) {
  // assumes space mode exists
  // planet-specific logic
}

// ❌ Shared gameplay systems between modes
class CombatSystem {
  handleSpaceWeapons() {
    /* */
  }
  handlePlanetWeapons() {
    /* */
  } // should be separate systems
}

// ❌ Mode-specific code in shared systems
class GameRenderer {
  render() {
    // draw space stuff
    if (hasEnemies) {
      /* space-specific logic */
    }
    // draw planet stuff
    if (hasCreatures) {
      /* planet-specific logic */
    }
  }
}
```

### 🎯 **Mode Coupling Guidelines**

| Coupling Type       | Example                                    | Space ↔ Planet | Verdict                             |
| ------------------- | ------------------------------------------ | --------------- | ----------------------------------- |
| **Shared Entity**   | Player with mode-specific physics          | ✅              | Allowed - core shared entity        |
| **Transition Data** | Position, basic state when switching modes | ✅              | Allowed - necessary for transitions |
| **Engine Services** | Rendering, input, audio, camera            | ✅              | Allowed - shared infrastructure     |
| **Gameplay Logic**  | Combat systems, progression mechanics      | ❌              | Forbidden - should be mode-specific |
| **UI Components**   | Space HUD in planet mode                   | ❌              | Forbidden - breaks mode isolation   |
| **Direct Imports**  | SpaceMode imports from PlanetMode          | ❌              | Forbidden - creates tight coupling  |

## Testing Your Changes

### 🧪 Mode Transition Testing

Always test that your changes work across mode transitions:

```typescript
// Test sequence
1. Start in space mode
2. Test your space feature
3. Land on a planet (L key)
4. Test your planet feature
5. Take off (T key)
6. Verify space mode still works
7. Verify no state bleeding between modes
```

### 🔍 Coupling Detection

Ask yourself these questions:

- **Can I remove this mode without breaking the other?**
- **Would a new developer understand which mode this code belongs to?**
- **Does this code make assumptions about the other mode?**
- **Could this feature work in isolation?**

## Future Vision: True Dual-Game Architecture

We're evolving toward this structure:

```
src/
├── engine/          # Shared game engine
├── games/
│   ├── space/       # Complete space game
│   └── planet/      # Complete planet game
└── shared/          # Common utilities
```

Each "game" will be a complete, independent implementation that uses the shared engine. This means:

- **Space game**: Could theoretically be extracted and shipped separately
- **Planet game**: Could be developed by a different team
- **Engine**: Reusable for other games or modes

## Common Pitfalls for New Contributors

### 1. **Adding Features to the Wrong Place**

```typescript
// ❌ Wrong: Adding planet creatures to SpaceMode
class SpaceMode {
  creatures: Creature[] = []; // belongs in PlanetMode
}

// ✅ Right: Mode-appropriate features
class SpaceMode {
  spaceStations: SpaceStation[] = [];
}
class PlanetMode {
  creatures: Creature[] = [];
}
```

### 2. **Creating Cross-Mode Dependencies**

```typescript
// ❌ Wrong: Planet mode importing space entities
import { Enemy } from "../SpaceMode"; // creates coupling

// ✅ Right: Each mode has its own entities
// PlanetMode has Creature, SpaceMode has Enemy
```

### 3. **Polluting Shared Systems**

```typescript
// ❌ Wrong: Mode-specific logic in shared renderer
class GameRenderer {
  render() {
    if (spaceMode) this.drawStars(); // mode-specific
    if (planetMode) this.drawTrees(); // mode-specific
  }
}

// ✅ Right: Delegate to mode-specific renderers
class GameRenderer {
  render() {
    if (currentMode === "space") {
      this.spaceRenderer.render();
    } else if (currentMode === "planet") {
      this.planetRenderer.render();
    }
  }
}
```

## Getting Started Checklist

Before making your first contribution:

- [ ] **Understand mode boundaries** - Read this guide and architecture docs
- [ ] **Test mode transitions** - Play the game, land on planets, take off
- [ ] **Examine similar features** - Look at how existing features are implemented
- [ ] **Identify the right mode** - Decide if your feature belongs in space, planet, or engine
- [ ] **Check for coupling** - Ensure your feature doesn't create cross-mode dependencies
- [ ] **Test both modes** - Verify your changes work in both space and planet modes

## Questions & Help

When you're unsure about architecture decisions:

1. **Check existing patterns** - How are similar features implemented?
2. **Ask yourself**: "Could this mode work without the other mode?"
3. **Consider the future** - Will this make the dual-game vision easier or harder?
4. **When in doubt** - Prefer mode-specific over shared implementations

Remember: **We'd rather have some duplication between modes than tight coupling between them.**

Welcome to the L.O.S.E. development team! 🚀🪐
