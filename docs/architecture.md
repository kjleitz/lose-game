# L.O.S.E. Architecture

## Overview

L.O.S.E. is a browser-only, top‑down 2D space exploration game built with Vite, React, and TypeScript. The world renders to an HTML5 canvas; React powers HUD and menus. We use a modular systems approach (renderer, physics, collision, input), orchestrated by a single game loop.

## Game Loop & Systems

- Loop: `requestAnimationFrame` with a fixed/accumulated timestep (e.g., 60Hz physics) and decoupled rendering.
- Systems: pure functions/modules operating on game state (physics, collision, renderer, input); composed in a stable order each tick.
- State: React Context + hooks expose selected state to UI; core simulation state lives in `src/game`.

## Modules

- `src/engine/loop` — RAF scheduler and timestep accumulator.
- `src/engine/renderer` — canvas context, camera, layers.
- `src/engine/physics` — integration, forces, simple constraints.
- `src/engine/collision` — broadphase (grid) + narrowphase, resolutions.
- `src/engine/input` — keyboard mapping and action queue (future: gamepad).
- `src/game/` — domain models (ships, sectors), content, spawning.
- `src/ui/` — HUD (status, minimap, inventory) and menus.

## Rendering

- Canvas 2D API; batched draws per layer. Camera handles world→screen transforms. Consider OffscreenCanvas later for worker-based rendering if main-thread contention appears.

## Testing

- Unit tests for systems (deterministic inputs/outputs); component tests for HUD via React Testing Library; smoke tests for Loop + Renderer integration.

## Future Directions

- Performance: OffscreenCanvas + Worker, sprite atlases, pooling.
- Input: rebindable controls, gamepad; persistence in localStorage.
- World: streaming sectors/chunks; save/load.
