# L.O.S.E. Roadmap

## Phase 0 — Tooling & CI

- ESLint + Prettier + Husky + lint-staged
- Vitest + React Testing Library
- Tailwind setup
- GitHub Actions: Node 24 build/typecheck/lint/test

## Phase 1 — Foundations

- App bootstrap, providers, canvas mount
- Game loop (fixed timestep), input module
- Renderer (camera, layers), basic sprites
- Physics integration + simple collision (AABB / circle)

## Phase 2 — Gameplay Core

- Player ship controls + thrust/turning/inertia
- Collision resolution + damage; simple AI actors
- Inventory model + item pickups; UI inventory panel
- HUD: health/shields/fuel, minimap, FPS

## Phase 3 — World & Content

- Sector/chunk layout; spawning; parallax background
- Entities: stations, asteroids, pickups, hazards
- Save/load (localStorage)

## Phase 4 — Polish & Performance

- Audio, particles, screen shake
- Performance passes: pooling, sprite atlas, culling
- Optional: OffscreenCanvas + Worker rendering

## Stretch

- Rebindable controls + gamepad
- E2E smoke tests (Playwright)
- Accessibility and localization
