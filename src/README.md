# src/

Source code for L.O.S.E.: Lots of Outer Space to Explore.

This is the main source directory organized using clean architecture principles with clear separation between UI, domain logic, and infrastructure concerns.

## Architecture Overview

The codebase follows a layered architecture:

- **`ui/`** - React components for HUD, overlays, and shell (app framework)
- **`domain/`** - Core game logic, ECS systems, and business rules
- **`application/`** - Application services that coordinate between UI and domain
- **`infrastructure/`** - External concerns (audio, persistence)
- **`lib/`** - Reusable libraries (ECS engine, behavior trees, storage)
- **`shared/`** - Cross-cutting types and utilities
- **`assets/`** - Game sprites and visual assets
- **`config/`** - Configuration constants

## Key Principles

- TypeScript strict mode with no `any`, casting, or type suppression
- Clean separation between React UI and canvas-based game world
- ECS (Entity Component System) for game state management
- Relative imports only, no path aliases
- Components colocated with tests (`*.test.tsx`)

## Getting Started

The entry point is `main.tsx` → `App.tsx` → `ui/shell/CanvasRoot.tsx` which sets up the game loop and React shell.

Game logic runs in `domain/` while UI renders in React. The two communicate through application services.

## File Naming

Files are named after their primary export: `FooBar.ts` exports `FooBar`, `doThing.ts` exports `doThing()`, etc.
