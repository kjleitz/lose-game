# L.O.S.E. — Project Overview

## Snapshot

- Stack: Vite + React + TypeScript (Node 24, npm)
- Rendering: HTML5 Canvas for game world; React for HUD/menus
- Architecture: Modular systems (loop, renderer, physics, collision, input); no ECS (yet)
- Styling: Tailwind (utility-first) with HUD-flavored tokens
- Testing: Vitest + React Testing Library; JSDOM with canvas mocked
- CI: GitHub Actions (build, typecheck, lint, test)

## Current State (working)

- Full-screen canvas with HiDPI scaling and visible crosshair
- Basic HUD chips and key→action mapping (WASD/Arrows/Space/E)
- Fixed-timestep game loop with accumulator; render decoupled
- Tooling wired: ESLint + Prettier + Husky + lint-staged, Tailwind, Vitest

## Layout

- `src/app` — app bootstrap (in `main.tsx`)
- `src/ui` — HUD/menus (`CanvasRoot` mounts canvas + HUD)
- `src/engine` — `loop`, `renderer`, `input` (physics/collision TBD)
- `src/game` — domain models/state (stubbed)
- `docs` — architecture, roadmap, ADRs

## Run & Dev

- Dev: `npm run dev` → open printed `http://localhost:5173`
- Tests: `npm run test` (watch) / `npm run coverage`
- Build/Preview: `npm run build` → `npm run preview`

## Near-Term Plan

- Loop: Add pause/resume and single-step controls (debugging).
- Input: Implement an action queue consumed once per tick (deterministic).
- Rendering: Introduce a camera and world layers (background, entities, FX).
- Player: Replace crosshair with a simple ship sprite and draw via a basic sprite system.
- Physics: Add integration step and a simple collision scaffold (broadphase grid + basic resolution).

## Agreed Defaults (debug + visuals)

- Pause key: `Esc`; Single-step key: `` ` `` (backtick)
- Step size: one fixed delta per step (default 1/60s)
- Ship: simple triangle sprite in HUD accent color
