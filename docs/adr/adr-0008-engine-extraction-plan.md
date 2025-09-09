# ADR-0008: Engine Extraction Plan for True Dual-Game Architecture

## Status

Proposed

## Context

Our current dual-game architecture successfully implements landable planets with mode switching, but the codebase still has significant coupling between modes and lacks a true shared engine abstraction. We need to evolve toward a structure where SpaceMode and PlanetMode are truly independent games sharing a common engine.

### Current Problems

1. **Shared GameSession**: Both modes depend on a monolithic GameSession class
2. **Coupled Systems**: Rendering, input, and physics systems contain mode-specific logic
3. **Unclear Boundaries**: No clear separation between engine code and game code
4. **Development Friction**: Adding features requires understanding both modes
5. **Testing Complexity**: Changes can unexpectedly affect the other mode

### Vision

Each game mode should be developable as a standalone game that happens to use a shared engine. A developer working on space features should never need to understand planet systems and vice versa.

## Decision

We will implement a phased extraction of shared systems into a true game engine, creating clear boundaries between engine and game code.

## Detailed Design

### Phase 1: Core Engine Services

Extract fundamental systems that both games need:

```typescript
// New engine structure
interface GameEngine {
  readonly input: InputManager;
  readonly renderer: RenderingEngine;
  readonly audio: AudioManager;
  readonly camera: CameraSystem;
  readonly physics: PhysicsEngine;
  readonly ui: UIManager;
  readonly save: SaveSystem;
}

// Factory function for creating configured engines
function createGameEngine(config: GameEngineConfig): GameEngine {
  return {
    input: new InputManager(config.inputBindings),
    renderer: new RenderingEngine(config.rendering),
    audio: new AudioManager(config.audio),
    camera: new CameraSystem(config.camera),
    physics: new PhysicsEngine(config.physics),
    ui: new UIManager(config.ui),
    save: new SaveSystem(config.save),
  };
}
```

### Phase 2: Game Abstraction Layer

Define a clean interface for what constitutes a "game":

```typescript
interface Game {
  readonly name: string;
  readonly version: string;

  // Lifecycle
  initialize(engine: GameEngine): void;
  update(dt: number): void;
  render(): void;
  cleanup(): void;

  // State management
  saveState(): GameState;
  loadState(state: GameState): void;

  // Mode transitions
  canTransitionTo(targetGame: string): boolean;
  prepareTransition(targetGame: string): TransitionData;
  receiveTransition(data: TransitionData): void;
}
```

### Phase 3: Concrete Game Implementations

```typescript
// Space game as independent implementation
class SpaceGame implements Game {
  readonly name = "space";
  readonly version = "1.0.0";

  private entities: SpaceEntity[] = [];
  private systems: SpaceSystem[] = [];
  private world: SpaceWorld;

  constructor(private config: SpaceGameConfig) {}

  initialize(engine: GameEngine): void {
    this.world = new SpaceWorld(this.config.world);
    this.systems = [
      new NavigationSystem(engine.input),
      new CombatSystem(),
      new AISystem(),
      new PlanetGenerationSystem(),
    ];
  }

  update(dt: number): void {
    // Pure space game logic - no planet concerns
    for (const system of this.systems) {
      system.update(dt);
    }
  }
}

// Planet game as independent implementation
class PlanetGame implements Game {
  readonly name = "planet";
  readonly version = "1.0.0";

  private entities: PlanetEntity[] = [];
  private systems: PlanetSystem[] = [];
  private surface: PlanetSurface;

  initialize(engine: GameEngine): void {
    this.systems = [
      new ExplorationSystem(engine.input),
      new CraftingSystem(),
      new CreatureAISystem(),
      new TerrainSystem(),
    ];
  }

  update(dt: number): void {
    // Pure planet game logic - no space concerns
    for (const system of this.systems) {
      system.update(dt);
    }
  }
}
```

### Phase 4: Game Manager Orchestration

```typescript
class GameManager {
  private currentGame: Game | null = null;
  private games: Map<string, Game> = new Map();
  private engine: GameEngine;

  constructor() {
    this.engine = createGameEngine(DefaultEngineConfig);

    // Register available games
    this.registerGame(new SpaceGame(SpaceGameConfig));
    this.registerGame(new PlanetGame(PlanetGameConfig));
  }

  switchToGame(gameName: string, transitionData?: TransitionData): void {
    const targetGame = this.games.get(gameName);
    if (!targetGame) throw new Error(`Game ${gameName} not found`);

    // Handle transition
    if (this.currentGame) {
      if (!this.currentGame.canTransitionTo(gameName)) {
        throw new Error(`Cannot transition from ${this.currentGame.name} to ${gameName}`);
      }
      this.currentGame.cleanup();
    }

    this.currentGame = targetGame;
    this.currentGame.initialize(this.engine);

    if (transitionData) {
      this.currentGame.receiveTransition(transitionData);
    }
  }

  update(dt: number): void {
    this.currentGame?.update(dt);
  }

  render(): void {
    this.currentGame?.render();
  }
}
```

## Directory Structure Changes

### Target Structure

```
src/
├── engine/                     # Shared game engine
│   ├── core/
│   │   ├── GameEngine.ts
│   │   ├── GameLoop.ts
│   │   ├── Camera.ts
│   │   └── Physics.ts
│   ├── input/
│   │   ├── InputManager.ts
│   │   ├── ActionMapping.ts
│   │   └── InputQueue.ts
│   ├── rendering/
│   │   ├── RenderingEngine.ts
│   │   ├── Canvas.ts
│   │   ├── Sprite.ts
│   │   └── Effects.ts
│   ├── audio/
│   │   ├── AudioManager.ts
│   │   ├── SoundEffect.ts
│   │   └── Music.ts
│   ├── ui/
│   │   ├── UIManager.ts
│   │   ├── HudSystem.ts
│   │   └── Menu.ts
│   └── persistence/
│       ├── SaveSystem.ts
│       └── Serialization.ts
├── games/                      # Independent game implementations
│   ├── space/                  # Complete space game
│   │   ├── SpaceGame.ts
│   │   ├── entities/
│   │   │   ├── Spaceship.ts
│   │   │   ├── Planet.ts
│   │   │   ├── Enemy.ts
│   │   │   └── Projectile.ts
│   │   ├── systems/
│   │   │   ├── NavigationSystem.ts
│   │   │   ├── CombatSystem.ts
│   │   │   ├── AISystem.ts
│   │   │   └── PlanetGenerationSystem.ts
│   │   ├── rendering/
│   │   │   ├── SpaceRenderer.ts
│   │   │   ├── StarfieldRenderer.ts
│   │   │   ├── ShipRenderer.ts
│   │   │   └── PlanetRenderer.ts
│   │   ├── ui/
│   │   │   ├── SpaceHud.tsx
│   │   │   ├── NavigationPanel.tsx
│   │   │   └── ShipStatus.tsx
│   │   ├── config/
│   │   │   ├── SpaceGameConfig.ts
│   │   │   ├── ShipStats.ts
│   │   │   └── EnemyTypes.ts
│   │   └── tests/
│   │       ├── SpaceGame.test.ts
│   │       └── systems/
│   └── planet/                 # Complete planet game
│       ├── PlanetGame.ts
│       ├── entities/
│       │   ├── Character.ts
│       │   ├── Creature.ts
│       │   ├── Resource.ts
│       │   └── Structure.ts
│       ├── systems/
│       │   ├── ExplorationSystem.ts
│       │   ├── CraftingSystem.ts
│       │   ├── CreatureAISystem.ts
│       │   └── TerrainSystem.ts
│       ├── rendering/
│       │   ├── PlanetRenderer.ts
│       │   ├── TerrainRenderer.ts
│       │   ├── CharacterRenderer.ts
│       │   └── CreatureRenderer.ts
│       ├── ui/
│       │   ├── PlanetHud.tsx
│       │   ├── InventoryPanel.tsx
│       │   └── CraftingInterface.tsx
│       ├── config/
│       │   ├── PlanetGameConfig.ts
│       │   ├── CreatureTypes.ts
│       │   └── ResourceTypes.ts
│       └── tests/
│           ├── PlanetGame.test.ts
│           └── systems/
├── shared/                     # Cross-cutting utilities
│   ├── types/
│   │   ├── Game.ts
│   │   ├── Entity.ts
│   │   └── System.ts
│   ├── utils/
│   │   ├── math.ts
│   │   ├── random.ts
│   │   └── validation.ts
│   └── constants/
│       └── gameConstants.ts
└── application/                # Application orchestration
    ├── GameManager.ts
    ├── main.tsx
    └── App.tsx
```

### Migration Steps

#### Step 1: Extract Input System

- Move input handling to `engine/input/`
- Create game-specific input configurations
- Update both modes to use engine input system

#### Step 2: Extract Rendering System

- Move core rendering to `engine/rendering/`
- Create renderer factories for each game
- Separate sprite management from game logic

#### Step 3: Extract Physics System

- Move physics calculations to `engine/core/`
- Create physics configurations per game
- Abstract collision detection

#### Step 4: Game-Specific Refactoring

- Move SpaceMode to `games/space/SpaceGame.ts`
- Move PlanetMode to `games/planet/PlanetGame.ts`
- Implement Game interface

#### Step 5: GameManager Integration

- Replace GameSession with GameManager
- Implement transition system
- Update UI to use GameManager

## Implementation Plan

### Phase 1: Foundation (2-3 weeks)

- [ ] Create `engine/` directory structure
- [ ] Extract InputManager to engine
- [ ] Create Game interface
- [ ] Update one mode to use new structure

### Phase 2: Core Systems (3-4 weeks)

- [ ] Extract RenderingEngine
- [ ] Extract AudioManager
- [ ] Extract Camera system
- [ ] Extract Physics engine

### Phase 3: Game Implementations (2-3 weeks)

- [ ] Convert SpaceMode to SpaceGame
- [ ] Convert PlanetMode to PlanetGame
- [ ] Implement GameManager
- [ ] Update transition system

### Phase 4: Polish & Testing (1-2 weeks)

- [ ] Comprehensive testing
- [ ] Performance optimization
- [ ] Documentation updates
- [ ] Migration guides

## Benefits

### Development Experience

- **Clear boundaries**: Developers know exactly where to add features
- **Independent development**: Teams can work on different games without conflicts
- **Better testing**: Each game can be tested in isolation
- **Faster iteration**: Changes to one game don't affect the other

### Technical Benefits

- **Performance**: Load only systems needed for current game
- **Maintainability**: Clear separation of concerns
- **Extensibility**: Easy to add new game modes
- **Reusability**: Engine can be used for other projects

### Business Benefits

- **Team scaling**: Different teams can own different games
- **Feature velocity**: Independent development streams
- **Quality**: Isolated testing reduces cross-mode bugs
- **Innovation**: Each game can explore unique mechanics

## Risks & Mitigations

### Risk: Over-Engineering

**Mitigation**: Start simple, extract only what's necessary. Don't abstract until you have multiple concrete implementations.

### Risk: Development Overhead

**Mitigation**: Phased approach allows incremental benefits. Each phase delivers value independently.

### Risk: Performance Regression

**Mitigation**: Benchmark at each phase. The engine abstraction should be zero-cost or provide performance benefits.

### Risk: Developer Confusion

**Mitigation**: Comprehensive documentation, examples, and migration guides. Clear naming conventions.

## Success Metrics

- **Developer Productivity**: Time to implement new features decreases
- **Bug Isolation**: Cross-mode bugs become impossible
- **Test Coverage**: Each game achieves >90% test coverage independently
- **Performance**: Frame rate remains stable or improves
- **Code Quality**: Cyclomatic complexity decreases per module

## Alternatives Considered

### Alternative 1: Keep Current Structure

**Pros**: No migration effort, familiar to current team
**Cons**: Continued coupling, difficulty scaling development, cross-mode bugs

### Alternative 2: Complete Rewrite

**Pros**: Clean slate, perfect architecture
**Cons**: High risk, long development time, potential to lose existing features

### Alternative 3: Plugin Architecture

**Pros**: Maximum flexibility, hot-swappable games
**Cons**: Added complexity, potential performance overhead

## Decision Rationale

The phased extraction approach provides the best balance of risk and reward. It allows us to incrementally improve the architecture while delivering value at each step. The clear separation will enable independent development teams and make the codebase more maintainable long-term.

This approach also aligns with the project's goal of creating two distinct gaming experiences that share infrastructure, rather than trying to build one game that does everything.
