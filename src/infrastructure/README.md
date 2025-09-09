# src/infrastructure/

External system integrations and technical infrastructure. This layer handles concerns that are outside the core game logic but necessary for the application to function.

## Structure

- **`audio/`** - Audio system integration and sound management

## Purpose

Infrastructure components handle "technical" concerns that support the game but aren't part of the core business logic:

- External API integrations
- File system operations
- Audio/video systems
- Network communication (if added)
- Device-specific functionality

## Key Concepts

**Separation of Concerns**: Infrastructure code is kept separate from domain logic to maintain clean architecture boundaries.

**Testability**: Infrastructure components should be designed to be easily mocked or stubbed for testing domain logic in isolation.

**Abstraction**: Infrastructure often provides abstract interfaces that domain services can depend on without coupling to specific implementations.

## Testing

Infrastructure components may require integration tests with external systems, but should provide mockable interfaces for unit testing other layers.
