# L.O.S.E.: Lots of Outer Space to Explore

Top‑down 2D open‑world space exploration game. Canvas for the world; React for HUD/menus. Browser‑only.

Documentation

- Docs index: docs/index.md
- Architecture: docs/architecture.md
- Testing: docs/testing.md
- CI: docs/ci.md
- HUD: docs/hud.md
- ADRs: docs/decisions/
- Contributing: CONTRIBUTING.md

## Getting Started

- Node 24, npm
- Install: `npm install`
- Dev: `npm run dev` → open printed URL
- Tests: `npm run test` (watch) / `npm run coverage`
- Lint/format: `npm run lint` / `npm run format`
- Build/preview: `npm run build` → `npm run preview`

## Project Structure

- `src/ui/` — HUD and canvas mount (`CanvasRoot`), React components and hooks
- `src/application/` — application layer (game loop, input orchestration)
- `src/domain/` — core game logic (game state, rendering services, AI, services)
- `src/engine/` — reusable engine pieces (`core/` loop, `input/`), extracted from application over time
- `src/games/` — mode-specific games (`space/`, `planet/`) in the dual‑game architecture
- `src/lib/ecs/` — internal ECS library package used by game systems
- `src/shared/` — shared utilities, types, and constants
- `src/infrastructure/` — project assets and technical adapters
- `docs/` — overview, architecture, roadmap, ADRs

## Docs

- Overview: `docs/overview.md`
- Architecture: `docs/architecture.md`
- Dual‑Game System: `docs/architecture/dual-game-system.md`
- Roadmap: `docs/roadmap.md`
- Decisions (ADRs): `docs/decisions/`
- Contributor guide: `AGENTS.md`

## Notes

- Fixed‑timestep loop (60Hz default) with render decoupled
- HiDPI canvas scaling; no path aliases
- Tooling: ESLint + Prettier + Husky, Vitest + RTL, Tailwind
