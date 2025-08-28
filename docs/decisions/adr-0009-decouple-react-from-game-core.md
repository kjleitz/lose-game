# ADR-0009: Decouple React HUD from Game Core

- Status: Accepted
- Date: 2025-08-26
- Owners: Game/Engine team

## Goal

- Decouple game simulation and canvas rendering from React entirely.
- React is only responsible for mounting the canvas node and rendering HUD controls.
- Provide a clean, typed API between the game core and any HUD implementation (including non‑React).

## Non‑Goals

- Rewriting ECS, physics, or AI.
- Changing rendering style or assets.
- Introducing web workers (may be considered later).

## Overview

- Core loop, input, simulation, and canvas rendering run imperatively, independent of React.
- A small “Game App” bootstrap wires the engine, ECS, input, and renderer to a single canvas and exposes a controller API.
- A typed event bus mediates data flow between the game and any HUD. React is an optional HUD layer plugged into this bus.

## Modules

- Engine
  - `src/engine/input/*`: Key→action mapping and action queue; attaches DOM listeners to `window` or `canvas`.
  - Note: the old `engine/core/GameEngine.ts` wrapper has been removed; the app bootstrap (`GameApp`) owns loop orchestration.
- Simulation
  - `src/domain/ecs/GameSessionECS.ts`: ECS world, systems registration, and state queries (player, planets, enemies, projectiles, camera).
- Rendering
  - `src/domain/render/GameRenderer.ts`: Draws to a provided `CanvasRenderingContext2D` using session queries.
- Application Bootstrap
  - `src/application/GameApp.ts`: Orchestrates input + ECS session + renderer and loop.
  - New `src/application/GameAPI.ts`: Public types and controller interface.
  - New `src/application/GameBus.ts`: Typed pub/sub for game→HUD and HUD→game messages.
- UI (optional)
  - React HUD reads from the bus and issues commands through the controller.
  - `src/ui/components/CanvasRoot.tsx` only mounts a canvas element and bootstraps `GameApp`.

## Data Flow

- Input: DOM key events → `InputManager` → action state → PlayerControlSystem.
- Simulation: Engine tick calls `session.update(actions, dt)` then posts “tick” and any deltas on the bus.
- Rendering: rAF loop renders with `GameRenderer` pulling state from `session` directly; independent cadence from React.
- HUD: Subscribes to bus for snapshots/notifications; sends commands on user interaction.

## Public API

- `GameApp.create(canvas: HTMLCanvasElement, options: GameOptions): Promise<GameController>`
  - Initializes input listeners, session, engine, and renderer. Returns a controller.

- `GameController` (stable, UI‑agnostic)
  - `start(): void`, `stop(): void`, `pause(): void`, `resume(): void`, `dispose(): void`
  - `setSpeed(multiplier: number): void`
  - `setZoom(zoom: number): void`
  - `getSnapshot(): GameSnapshot`
  - `bus: GameBus` (typed event bus)
  - `dispatch(action: Action): void` (optional programmatic input)
  - `rebind(action: Action, code: string): void`

- `GameOptions`
  - `size: { width: number; height: number }`
  - `camera?: { x: number; y: number; zoom: number }`
  - `initialWorld?: { player?: PlayerInit; planets?: PlanetInit[]; enemies?: EnemyInit[] }`
  - `render?: { pixelRatio?: number }`
  - `input?: { target?: Window | HTMLElement }`

- `GameSnapshot` (HUD friendly)
  - `player: { x: number; y: number; vx: number; vy: number; angle: number; health: number; experience: number }`
  - `camera: { x: number; y: number; zoom: number }`
  - `planets: Array<{ id: string; x: number; y: number; radius: number; color: string; design: 'solid'|'ringed'|'striped'|'spotted' }>`
  - `enemies: Array<{ id: string; x: number; y: number; angle: number; health: number; radius: number }>`
  - `projectiles: Array<{ x: number; y: number; radius: number }>`
  - `stats: { fps: number; entityCount: { players: number; enemies: number; planets: number; projectiles: number } }`

- `GameBus` (typed pub/sub)
  - `subscribe<T extends GameEvent['type']>(type: T, handler: (e: Extract<GameEvent, {type: T}>) => void): Unsubscribe`
  - `publish(e: GameEvent): void`
  - `onAny(handler: (e: GameEvent) => void): Unsubscribe`

- `GameEvent` (discriminated union)
  - Outbound (game → HUD)
    - `{ type: 'tick'; snapshot: GameSnapshot }`
    - `{ type: 'notification'; message: string }`
    - `{ type: 'modeChange'; mode: 'space' | 'planet' }`
    - `{ type: 'healthChanged'; value: number }`
    - `{ type: 'xpChanged'; value: number }`
    - `{ type: 'inventoryUpdated'; /* typed inventory view */ }`
  - Inbound (HUD → game)
    - `{ type: 'setSpeed'; value: number }`
    - `{ type: 'pauseToggle' }`
    - `{ type: 'land' }`
    - `{ type: 'takeoff' }`
    - `{ type: 'useItem'; itemId: string }`
    - `{ type: 'dropItem'; itemId: string; quantity: number }`
    - `{ type: 'rebind'; action: Action; code: string }`

All types are concrete; no `any`, no casting. Optional properties are guarded at call sites.

## Initialization Sequence

1. UI mounts a canvas element.
2. UI calls `GameApp.create(canvas, options)` and gets a `GameController`.
3. `GameApp`:
   - Creates `InputManager` and attaches listeners to `options.input.target ?? window`.
   - Instantiates `GameSessionECS` (default spawns if not provided).
   - Builds systems: player control, enemy AI, movement, collision, weapon, projectile.
   - Creates `GameRenderer` and computes DPR (fixed per resize).
   - Starts `GameEngine` with fixed update dt and rAF render callback.
   - Publishes initial `{ type: 'tick', snapshot }`.
4. UI subscribes to `bus` to update HUD panels; issues commands via `controller.bus.publish` or method calls.
5. On UI unmount, call `controller.dispose()` to remove listeners and cancel rAF.

## Rendering Cadence

- Update loop: fixed timestep (e.g., 1/60s), capped catch‑up.
- Render loop: rAF; always reads directly from `GameSessionECS` queries.
- Canvas resize: sized and DPR‑scaled only on size change; renderer uses `CameraTransform`.

## React Integration (Thin)

- `CanvasRoot`:
  - Renders `<canvas ref={...} data-testid="game-root" />`.
  - `useEffect` once: `GameApp.create(canvas, { size })` then `controller.start()`.
  - Subscribes to `bus` for HUD state; stores only HUD‑needed data in local state (e.g., notification, health/xp, planets for radar).
  - HUD interactions publish commands or call `controller` methods.
  - Cleanup: `controller.dispose()`.

No React state is needed to drive canvas rendering. Canvas state is derived from session each frame.

## Example Usage (React HUD as optional layer)

- Mount
  - `const controller = await GameApp.create(canvas, { size: { width, height } });`
  - `controller.start();`
- HUD subscribe
  - `const unsub = controller.bus.subscribe('tick', e => setHudState(deriveHud(e.snapshot)));`
- Commands
  - `controller.bus.publish({ type: 'setSpeed', value: 1.5 });`
  - `controller.bus.publish({ type: 'land' });`

## Testing Strategy

- Engine: fixed‑step accumulator and pause/resume.
- Input: key events → queue/state transitions.
- Session: systems integration tests step with deterministic dt.
- Renderer: headless canvas context mock; assert draw sequence for planets/enemies/ship.
- API Contract: `GameApp.create` returns controller; `tick` carries snapshot; commands mutate as expected.
- E2E: canvas renders entities on first frame; ship moves smoothly; radar shows planets; space fires.

## Performance Considerations

- Avoid per‑frame object churn in HUD snapshots:
  - Option A: throttle `tick` snapshots to 10–20 Hz for HUD while render runs at rAF.
  - Option B: structural sharing of snapshot arrays.
- Keep bus handlers cheap; offload heavy HUD work to `requestIdleCallback` if needed.
- Clamp dt to avoid large catch‑up stutter (already in engine).

## Migration Plan

1. Add `GameAPI.ts` (types) and `GameBus.ts` (pub/sub).
2. Create `GameApp.ts` wiring Session, Engine, Renderer, Input and exposing controller.
3. Refactor `CanvasRoot` to bootstrap `GameApp`; remove direct session props from React.
4. Update HUD to consume `tick` events and issue commands.
5. Remove remaining coupling between React props and renderer.
6. Add integration tests for `GameApp` and bus contracts.
7. Update docs and troubleshooting.

## Risks & Mitigations

- HUD expects high‑frequency updates → React churn.
  - Mitigate by throttling HUD `tick` or deriving minimal UI state.
- Input focus conflicts (typing into fields).
  - Allow binding input to `canvas` or opt‑in `target` element; expose `enable/disable` capture.
- Contract drift between session queries and snapshot.
  - Centralize snapshot derivation in `GameApp` with tests.

## Open Questions

- Snapshots vs. deltas for HUD? Start with snapshots; consider deltas later.
- Batch commands vs. discrete events? Start discrete; add batching if necessary.

## Success Criteria

- Game runs fully (update/render/input) without React.
- React HUD can be swapped or removed entirely; gameplay remains intact.
- Initial frame renders planets/enemies/ship without movement.
- Inputs work regardless of React lifecycle.
- Tests cover API contract and core systems; CI catches mapping regressions.
