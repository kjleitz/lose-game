# src/config/

Game configuration constants and settings. This directory contains compile-time configuration values that affect game behavior.

## Purpose

Configuration includes:

- Game balance constants (health, damage, speeds)
- UI layout and sizing parameters
- Default key bindings
- Physics constants (gravity, friction, etc.)
- Rendering settings (colors, scales, etc.)

## Key Concepts

**Compile-Time Configuration**: These are constants baked into the build, not runtime user settings (those live in `application/settings/`).

**Single Source of Truth**: Configuration values should be defined once here and imported where needed, rather than scattered as magic numbers throughout the code.

**Typed Constants**: Use TypeScript's `const` assertions and `readonly` to ensure configuration values can't be accidentally modified.

**Categorized**: Group related constants together (physics, UI, gameplay, etc.) for easy discovery.

## Guidelines

- Export configuration as typed constant objects
- Use descriptive names that explain the purpose, not just the value
- Include units in variable names when relevant (e.g., `maxSpeedPixelsPerSecond`)
- Document any non-obvious configuration values with comments
- Keep magic numbers out of other code by defining them here first
