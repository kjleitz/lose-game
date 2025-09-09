# src/application/

Application services that coordinate between the UI layer and domain logic. These services orchestrate complex operations and manage cross-cutting concerns.

## Structure

- **`game/`** - Core game session management and coordination
- **`input/`** - Input handling and key binding systems
- **`persistence/`** - Save/load functionality and data management
- **`settings/`** - User settings and configuration management

## Purpose

Application services act as the "glue" between React components and domain logic. They:

- Coordinate complex operations across multiple domain services
- Manage application state that doesn't belong in pure domain logic
- Handle side effects like persistence and external system integration
- Provide clean APIs for UI components to interact with game logic

## Key Concepts

**Session Management**: Game sessions are managed here, including state transitions between space and planet modes.

**Input Processing**: Raw input events are processed and translated into game actions through this layer.

**Persistence**: Save data serialization and loading logic lives here, keeping domain objects pure.

**Settings**: User preferences and game configuration are managed as application concerns rather than domain logic.

## Testing

Application services should be tested to ensure proper coordination between layers and correct handling of side effects.
