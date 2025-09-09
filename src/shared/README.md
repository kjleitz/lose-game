# src/shared/

Cross-cutting utilities, types, and constants used throughout the application. This is the "commons" area for code that doesn't fit cleanly into other architectural layers.

## Structure

- **`types/`** - TypeScript type definitions shared across layers

## Purpose

Shared code includes:

- Common TypeScript types and interfaces
- Utility functions used by multiple layers
- Constants and enums referenced across the codebase
- Helper functions that don't belong to a specific domain

## Key Concepts

**Layer-Agnostic**: Shared code should not depend on specific architectural layers (UI, domain, application, infrastructure).

**Minimal Dependencies**: Shared utilities should have few or no external dependencies to avoid circular imports.

**Pure Functions**: Most shared utilities should be pure functions that are easy to test and reason about.

**Types Only**: When possible, prefer sharing types over sharing implementation to maintain loose coupling.

## Guidelines

- Keep shared code minimal - prefer placing utilities in their specific domain when possible
- Avoid business logic in shared utilities
- Document shared types thoroughly since they're used widely
- Consider if shared code might belong in `src/lib/` instead if it's truly reusable
