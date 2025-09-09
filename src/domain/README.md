# src/domain/

Core game logic and business rules. This layer contains the "heart" of the game and is independent of UI frameworks or external systems.

## Structure

- **`ecs/`** - Entity Component System implementation with components, entities, systems, and collision detection
- **`game/`** - Game-specific logic for inventory, weapons, damage, planet surfaces, ship interiors, and flora
- **`physics/`** - Physics calculations and movement systems
- **`render/`** - Canvas rendering logic and utilities (not React UI)
- **`services/`** - Domain services that coordinate complex operations
- **`leveling/`** - Character progression and experience systems

## Key Concepts

**ECS Architecture**: The game uses Entity Component System architecture where:

- Entities are unique IDs
- Components store data (position, velocity, health, etc.)
- Systems process entities with specific component combinations

**Coordinate Spaces**: The game maintains separate coordinate systems for space and planet modes. Player position is tracked separately in each mode.

**Physics**: Space flight uses momentum-based movement without speed caps. Planet mode uses direct velocity control for walking.

**Rendering**: Canvas rendering utilities live here, not in `ui/`. This keeps rendering logic separate from React components.

## Testing

Domain logic should have comprehensive unit tests covering intended behavior. Focus on testing business rules and edge cases.
