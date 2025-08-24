# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

L.O.S.E. (Lots of Outer Space to Explore) is a top-down 2D open-world space exploration game built with TypeScript, React, and Canvas. Canvas handles the game world rendering, while React manages the HUD and UI components. This is a browser-only game.

## Essential Commands

### Development

- `npm run dev` - Start development server, opens at printed URL
- `npm run build` - Build for production (TypeScript compile + Vite build)
- `npm run preview` - Preview production build locally

### Testing

- `npm run test` - Run unit tests (Vitest watch mode)
- `npm run coverage` - Run tests with coverage report
- `npm run e2e` - Run end-to-end tests (Playwright)
- `npm run e2e:report` - View Playwright test report

### Code Quality

- `npm run lint` - Run ESLint
- `npm run typecheck` - TypeScript type checking without emit
- `npm run format` - Format code with Prettier

## Architecture

### Core Structure

- **`src/domain/`** - Pure game logic and domain models
  - `game/` - Game state (GameSession, Player, Planets, Enemies, Projectiles)
  - `render/` - Rendering systems (GameRenderer, Camera, EnemyRenderer, etc.)
  - `ai/` - AI behavior tree system for enemy behaviors
  - `services/` - Domain services (RadarService)
- **`src/ui/`** - React components and UI layer
  - `components/` - React components including CanvasRoot (main game mount)
  - `hud/` - Modular HUD system with panels and components (see ADR-0005)
  - `hooks/` - Custom React hooks for game state
- **`src/application/`** - Application layer (game loop, input management)
- **`src/shared/`** - Shared utilities

### Key Patterns

- **GameSession** (`src/domain/game/GameSession.ts`) - Central game state manager that coordinates player, enemies, projectiles, and world updates
- **Fixed timestep loop** - 60Hz default with decoupled rendering
- **Entity-component pattern** - Game objects have separate state and renderer classes
- **Behavior Trees** (`src/domain/ai/bt.ts`) - Lightweight BT system for enemy AI with Success/Failure/Running statuses
- **Modular HUD** - Small, pure React components with stable data-testids (ADR-0005)
- **React for UI** - HUD overlays the Canvas, no game logic in React components
- **HiDPI canvas scaling** - Handles high-density displays

### Data Flow

1. Input captured via `useInput` hook
2. GameSession processes actions and updates world state
3. CanvasRenderer draws game world to canvas
4. React HUD components display UI overlays
5. Game loop coordinates timing at fixed 60Hz

## Testing Setup

- **Vitest** for unit/component tests with jsdom environment
- **React Testing Library** for component testing
- **Playwright** for e2e tests (runs against preview build on port 4173)
- **Coverage** reports available in text and HTML format

## Important Workflow Notes

- **Always check `docs/` folder first** when starting new tasks - contains architecture docs, testing guidance, HUD documentation, ADRs, and other essential context
- Key docs: `docs/index.md` (entry point), `docs/code-map.md` (module responsibilities), `docs/hud.md`, `docs/decisions/` (ADRs)

## Recent Major Changes

- **HUD Modularization** (ADR-0005): HUD split into panels (`StatusPanel`, `ControlsPanel`) and components (`HealthBar`, `Radar`, etc.) under `src/ui/hud/`
- **Enemy AI System** (ADR-0006): Behavior tree implementation added (`src/domain/ai/bt.ts`) for enemy AI behaviors
- **Combat System**: Projectiles and enemy health/damage system implemented
- **Comprehensive Testing**: Both Vitest unit tests and Playwright e2e tests configured

## Tech Stack

- TypeScript with strict settings
- React 19 with functional components and hooks
- Vite for build tooling
- Tailwind CSS for styling
- ESLint + Prettier with Husky pre-commit hooks
- Simplex noise for procedural generation
