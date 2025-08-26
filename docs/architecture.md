# L.O.S.E. Architecture

## Overview

L.O.S.E. is a browser‑only, top‑down 2D space exploration game built with Vite, React, and TypeScript. The world renders to an HTML5 canvas; React powers HUD and menus. The core is organized with clear layers (UI, Application, Domain), with a fixed‑timestep loop and an internal ECS library for systems that benefit from data‑oriented design.

## Game Loop & Systems

- Loop: `requestAnimationFrame` with fixed/accumulated timestep (60Hz target) and decoupled rendering.
- Systems: domain systems (movement, collision, rendering, AI) operate over state; composed in a stable order each tick.
- State: UI reads snapshots via hooks; core simulation state lives under `src/domain/**`.

## Modules (current)

- `src/application/game/loop.ts` — RAF scheduler and timestep accumulator.
- `src/engine/core/` — extracted loop primitives and timing helpers.
- `src/engine/input/` — keyboard mapping and action queue; mode‑aware actions.
- `src/domain/game/` — game session, player, enemies, projectiles, modes.
- `src/domain/render/` — canvas renderer, camera transforms, renderers.
- `src/lib/ecs/` — internal ECS used by selected systems.
- `src/ui/` — HUD (status, radar, inventory) and menus.

## Rendering

- Canvas 2D API with camera transforms for world↔screen mapping. Renderers live in `src/domain/render/`. Consider OffscreenCanvas/Worker if main‑thread contention appears.

## Testing

- Unit tests for systems; component tests for HUD via React Testing Library; integration smoke tests for loop + renderer.

## Future Directions

- Performance: OffscreenCanvas + Worker, sprite atlases, pooling.
- Input: rebindable controls, gamepad; persistence in localStorage.
- World: streaming sectors/chunks; save/load.
