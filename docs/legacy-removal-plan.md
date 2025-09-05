# Legacy Removal Plan

Purpose: remove legacy code paths and converge on the ECS-based architecture. For each legacy/new pair, we justify the newer path and list any gaps to migrate before deleting the legacy code.

## Scope Overview

- Session/Orchestration: `GameSessionECS` (new) vs `GameManager` + `GameSessionV2` (legacy)
- Modes: `domain/game/modes/*` (new) vs `games/*/*Game.ts` (legacy)
- Rendering: `domain/render/*` (new, shared), no legacy parallel to keep
- Engine wrapper: `engine/core/GameEngine` (legacy scaffolding for `GameManager`)
- Types bridge: `shared/types/Game.ts` (legacy interfaces around `GameManager`/`*Game`)
- Input/Settings/Persistence: shared and used by new path; keep

## What's Missing / Newly Identified

- Planet surface duplication exists in three places (ECS, `PlanetMode`, legacy `PlanetGame`).
- Renderer-local PlanetSurface types duplicate domain types; causes unsafe casts.
- Weapons/Projectiles logic exists twice (domain weapons vs ECS system).
- Dropped-items logic exists twice (domain system vs ECS system).
- Modes (`SpaceMode`/`PlanetMode` classes) are currently unused by the app entry; only their types leak into ECS.
- Input mapping mismatch in ECS planet movement (uses `interact` for down vs `moveDown`).
- Tests reach into private ECS state via `as any` instead of public getters.
- `GameSessionV2` is a wrapper only around `GameManager`; not referenced by app/tests.
- `engine/core/*` only exists to satisfy `GameManager`; not referenced by app/tests.

## Mapping and Justification

### Session/Orchestration

- New: `src/domain/ecs/GameSessionECS.ts`
  - Centralizes game state in an ECS world; exposes stable getters for UI and `GameRenderer`.
  - Actively used by `GameApp` (the production entry): `GameApp -> GameSessionECS -> GameRenderer`.
- Legacy: `src/application/GameManager.ts`, `src/domain/game/GameSessionV2.ts`
  - Wraps `SpaceGame`/`PlanetGame` and a bespoke engine. No longer used by `GameApp`.
- Gaps to migrate (before delete):
  - Takeoff proximity gating (must be near ship/landing site): currently handled in classic `PlanetMode`, not in `GameSessionECS` (ECS just checks `takeoff`).
  - Terrain/environment blocking: ECS has combat collisions but no blocking vs terrain features (rocks/vegetation) because features are not ECS colliders. Classic path just added blocking in `PlanetMode`.

### Modes

- Consolidated: Modes are represented as states within `GameSessionECS`.
- Removed: `src/domain/game/modes/SpaceMode.ts`, `src/domain/game/modes/PlanetMode.ts` (after extracting shared generator and porting features).

### Rendering

- New: `src/domain/render/*` including `GameRenderer`, `PlanetSurfaceRenderer`, `ShipRenderer`, `EnemyRenderer`, etc.
  - Unified renderer used by `GameApp`. Also includes new biome/water/sky features.
- Legacy: none to keep; `games/*` classes did not contain a rendering layer we retain.
- Gaps: none; current tests and app use the domain renderers.
  - Type cohesion gap: `GameRenderer` and `PlanetSurfaceRenderer` define local, duplicate PlanetSurface shapes and require casts. Prefer importing a single canonical `PlanetSurface` type from `domain/game/modes/PlanetMode` (or a new shared types module) and removing casts.

### Engine Wrapper

- New: none required; `GameApp` calls `GameSessionECS` directly.
- Legacy: `src/engine/core/GameEngine.ts` + `src/engine/core/index.ts`
  - Only used by `GameManager`. Remove along with `GameManager`.
- Gaps: none.

### Types Bridge

- New: prefer concrete types from ECS/modes (`domain/game/modes/PlanetMode` for `PlanetSurface`, etc.).
- Legacy: `src/shared/types/Game.ts`
  - Ties to `games/planet/PlanetGame` via `PlanetSurface` import; defines `Game`/`GameEngine` interfaces used only by legacy.
- Gaps to migrate:
  - Replace any remaining imports of `shared/types/Game` in tests or utilities with ECS/mode types, or local interfaces.
  - Remove duplicate renderer-local PlanetSurface types once a canonical type is exported and used end-to-end.

### Planet Surface Generation (Unified)

- Current generators:
  - ECS: `GameSessionECS.generatePlanetSurface` (procedural terrain/resources/creatures/water + biome pick).
  - Mode: `PlanetMode.generatePlanetSurface` (similar logic, different tuning + flora/effects hooks).
  - Legacy: `games/planet/PlanetGame.generatePlanetSurface`.
- Status:
  - Implemented `src/domain/game/planet-surface/generate.ts` returning canonical `PlanetSurface`.
  - ECS uses this generator; duplicate generators were removed alongside legacy classes.
  - Keep biome selection as part of the shared generator API; renderer-specific parallax remains in render code.

### Weapons and Projectiles (Duplication)

- Current implementations:
  - ECS: `src/domain/ecs/systems/WeaponSystem.ts` (actions → projectiles in ECS world).
  - Domain: `src/domain/game/weapons/WeaponSystem.ts` (imperative projectiles + damage over domain entities).
- Plan:
  - Consolidate on the ECS system for runtime gameplay. Consider porting durability/damage type richness into ECS.

### Dropped Items (Duplication)

- Current implementations:
  - ECS: `src/domain/ecs/systems/DroppedItemSystem.ts` (aging + pickup event + entity removal).
  - Domain: `src/domain/game/items/DroppedItemSystem.ts` (map of items + pickup within range + despawn).
- Plan:
  - Continue to draw HUD/inventory from domain item types while using ECS runtime for pickup/aging. Remove domain system once fully covered.

### Input Parity (Resolved)

- Fixed: `PlayerControlSystem` now uses `moveDown` for down movement in planet mode.
- Updated: Pickups are proximity-based with attraction; `interact` (KeyC) is reserved for enter/exit ship.

## Deletion Candidates (Legacy)

- `src/games/planet/PlanetGame.ts`
- `src/games/space/SpaceGame.ts`
- `src/application/GameManager.ts`
- `src/domain/game/GameSessionV2.ts`
- `src/shared/types/Game.ts`
- `src/engine/core/GameEngine.ts`
- `src/engine/core/index.ts`

Note: Remove only after references are updated (see Tasks).

Completed deletions:

- `src/domain/game/GameSessionV2.ts` (wrapper around `GameManager`).
- `src/domain/game/modes/*` classes (SpaceMode, PlanetMode, GameMode, ModeTransition).
- Renderer-local PlanetSurface interfaces inside renderers (replaced with shared type import).

## Migration Tasks

1. Enforce ECS in app and tests

- Confirm no runtime entry uses `GameManager`/`*Game`.
- Update any tests importing `shared/types/Game` or `games/*` to use ECS/mode types.

2. Port missing behaviors to ECS

- Takeoff proximity gating: implemented; requires proximity to `landingSite`.
- Terrain blocking: implemented via `PlanetTerrainCollisionSystem`.
- Option A: spawn invisible collider entities for solid terrain features (rocks/vegetation) when generating `planetSurface`.
- Option B: add a light-weight terrain collision pass in `createMovementSystem` when mode is planet, using `planetSurface.terrain` for checks.
- Prefer A for ECS purity; B is faster to land.
- Input parity: fix planet movement mapping in ECS to use `moveDown` (not `interact`) for down movement.
- Projectiles/Weapons: port missing durability/damage-type behavior from domain weapons to ECS and delete domain implementation.
- Dropped items: rely on ECS pickup events for HUD inventory updates; delete domain system once parity is confirmed.

3. Normalize types

- Introduced shared `PlanetSurface` type in `domain/game/planet-surface/types` and used across ECS/renderers.
- Removed `shared/types/Game.ts` and local renderer interfaces/casts.

4. Delete legacy files

- Removed `games/*`, `GameManager`, `GameSessionV2`, `engine/core/*`.
- Ran/updated tests.

5. Clean notifications and HUD

- Ensure HUD prompts originate from `GameSessionECS.getNotification()` (already true for land/takeoff).
- Remove duplicate notification logic from legacy paths when deleting them.

6. Documentation

- Update `docs/rules.md` to reference this plan and record completion.
- Document type-discipline expectations for renderers/sessions (no local duplicate types, no casts) and record the removal of `shared/types/Game.ts`.

7. Extract and reuse planet surface generator

- Create `src/domain/game/planet-surface/generate.ts` and make ECS use it.
- Remove generator duplication in `PlanetMode` and `PlanetGame`.

8. Tests hygiene

- Replace `(session as any).planetSurface` in ECS tests with calls to `getPlanetSurface()` and mutate via the returned object as needed.
- Search for any test importing legacy files (`games/*`, `shared/types/Game`) and migrate them to ECS/session APIs.

## Rollout & Risk

- Expected impact: removal of dead code + fewer confusing paths.
- Risks: hidden imports in tests or tooling; mitigate by global search and staged PR commits.
- Exit criteria: test suite green, app behavior unchanged or improved (takeoff gating, terrain blocking present in ECS), zero references to removed files.

Additional checks before final deletion PR:

- `rg -n "shared/types/Game|GameManager|GameSessionV2|engine/core/GameEngine" src tests` returns empty.
- `rg -n "PlanetGame|SpaceGame" src tests` returns empty.
- Renderers import shared `PlanetSurface` type; no casts remain in `GameRenderer`.

## Owner/Tracking

- Owner: TBD
- Target: ASAP after ECS parity tasks (2) are merged.
