# src/lib/

Reusable libraries and utilities that could potentially be extracted into separate packages. These are self-contained modules with minimal external dependencies.

## Structure

- **`ecs/`** - Entity Component System engine implementation
- **`behavior-tree/`** - Behavior tree library for AI and complex decision logic
- **`storage/`** - Storage abstraction layer for persistence

## Purpose

Library code is:

- **Reusable**: Could be used in other projects or extracted as npm packages
- **Self-contained**: Minimal dependencies on other parts of the codebase
- **Well-tested**: Comprehensive test coverage with examples
- **Generic**: Not specific to this game's domain logic

## Key Concepts

**Framework Agnostic**: Libraries should not depend on React, game-specific types, or application concerns.

**Examples**: Each library includes example usage in its `examples/` directory to demonstrate how to use the APIs.

**Clean APIs**: Libraries expose simple, well-documented interfaces that hide implementation complexity.

**Testing**: Libraries have the highest testing standards since they're foundational components.

## Usage

Import from these libraries when you need their core functionality. If you find yourself copying code between projects, consider whether it belongs in `src/lib/`.
