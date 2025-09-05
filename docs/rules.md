# Project Rules

These are the guiding principles for development in this repo. Keep them short, explicit, and enforceable.

## Canonical Rules

- Remove legacy code promptly. Do not keep old paths or duplicate logic "just in case" or to appease stale tests.
- Tests are there to validate the application. The application is not there to validate the tests.
  - If a test enshrines behavior we no longer want, change or delete the test alongside the code change.
  - Do not retain legacy code paths solely to keep tests green.

## Architecture Migration

- When introducing a new architecture or subsystem (e.g., ECS planet mode), deprecate and remove the old implementation (e.g., legacy `PlanetGame`/`GameManager`) once the replacement is stable.
- Temporary duplication during migration is acceptable only with an explicit, near-term removal plan (tracked issue or PR checklist).
  - Current status: Legacy classes (`PlanetGame`, `SpaceGame`, `GameManager`, engine/core) have been removed. Modes are states inside `GameSessionECS` and share canonical `PlanetSurface` types.

## World Coordinates

- Maintain distinct coordinate spaces for space and planet modes.
  - Player has separate x/y in space and x/y on a planet; do not mutate one while the other mode is active.
  - On landing, move the player to the planet-local landing site. Do not translate the surface to match space coordinates.
  - On takeoff, place the player hovering just outside the planet in space (near the planet’s world position), not at an arbitrary prior approach vector.
  - Rendering and input operate in the active mode’s space; camera follows the active position only.

## Death & Reset

- Player death is global: if HP reaches 0 in any mode or the player entity is destroyed, show a red overlay with "u ded" and an "alive?" button.
- Clicking "alive?" respawns into a fresh space session at the starting point.
- Only the saved session is wiped on respawn. Settings and keybindings persist.

## Input and Settings Changes

- If key bindings or settings change, provide a one-time migration for persisted data (e.g., remap old keys). Do not revert product changes to satisfy historical tests.

## Testing Philosophy

- Keep tests aligned with the intended product behavior. Prefer high-value, integration-style tests at stable boundaries.
- When refactoring, update tests to reflect the new design; do not preserve obsolete seams.
- Unit tests should live right next to the file they cover, and should be named the same as the file but suffixed with `.test.ts(x)` instead of `.ts(x)`. For example: unit tests for `src/foo/Bar.ts` should live in `src/foo/Bar.test.ts`, NOT in some separate `src/foo/tests` directory.
- We want comprehensive unit tests which test INTENDED behavior (not just EXISTING behavior... which may actually be broken in some cases! We'll find out when we write tests against INTENDED BEHAVIOR.)

## Enforcement

- PRs that add duplicate logic must include a removal plan (owner + date). Prefer extracting shared helpers over duplication.
  - Do not duplicate structural types (e.g., `PlanetSurface`) in renderers or systems; import the canonical type.

## Tooling Discipline

- Do not change ESLint rules unless explicitly instructed. Fix code and types to satisfy the existing configuration.

### Mandatory Local Checks

- On every substantive change, run ALL three before handing off or opening a PR:
  - `npm run typecheck` — no TypeScript errors.
  - `npm run test` — tests pass (add or update as needed for changes).
  - `npm run lint` — lints pass without disabling rules.
- Formatting: if diff is messy, run `npm run format` to align with Prettier, but do not rely on formatting to hide issues; fix root causes first.

> Direct quote for emphasis: "GET RID OF THE LEGACY STUFF. Things SHOULD NOT hang around JUST TO SATISFY TESTS. Tests are there to validate your application. Your application is NOT THERE TO VALIDATE THE TESTS."

## Style and Naming

- No one-letter identifiers. Use descriptive variable, parameter, and function names for readability.
- Allowed exceptions: loop indices `i`/`j`/`k` and coordinates `x`/`y`.
- ESLint enforces `id-length` with min 2, excluding properties; `_` is allowed as a throwaway placeholder.
- Tests are allowed to use short identifiers when it meaningfully improves brevity (e.g., tiny helpers); the linter permits this only in `*.test.ts[x]` files.
- For canvas transforms, avoid `a..f`—prefer descriptive names (e.g., `m11`, `m12`, `dx`, `dy`).

## UI Structure & Conventions

- No top-level `components/` bucket under `src/ui/`. Organize by role and feature:
  - `src/ui/shell` for app shell, layout, providers (e.g., `CanvasRoot`, `GameLoopProvider`).
  - `src/ui/hud` for the in-game HUD with `widgets/`, `panels/`, `layout/`, and `hooks/` subfolders.
  - `src/ui/overlays` for dialogs, menus, and toasts not tied to HUD layout.
  - `src/ui/controls` for reusable UI primitives and composites (buttons, sliders, field groups).
- Colocate tests next to components (`*.test.tsx`).
- Use `index.ts` barrels per area to keep imports shallow; do not introduce path aliases.
- Non-React utilities (e.g., canvas rendering) live under `src/domain/render/`, not `src/ui`.

### HUD/Menu Visual Consistency

- Use one shared visual style for all HUD panels and UI menus.
  - The canonical style is the top-right HUD panel look.
  - Implement via the shared `hud-panel` utility class (see `src/index.css`) which sets the font (`font-hud`), background, border, rounding, and shadow.
  - All HUD panels and overlay menus/dialogs must wrap content in a `div.hud-panel` and only add spacing/positioning (e.g., `p-4`, `w-[...]`, `left-*`, `top-*`) as needed.
  - Headings and labels should use `hud-text` for accent coloring and tracking.

## TypeScript Discipline

- Strict TypeScript only. Do not weaken types to “make it work”. Fix types first.
- Never use `any`. If you think you need `any`, revisit the design. Prefer precise types; use `unknown` if necessary and narrow explicitly.
- Do not use `@ts-ignore` or `@ts-expect-error` as band-aids. Address the root cause.
- Avoid casting (`as T` or double-cast `as unknown as T`). Casting hides bugs and is only acceptable in rare, justified cases with prior maintainer approval.
- Be skeptical of `satisfies`. If it seems required, reevaluate the types or API. Only use with explicit reviewer approval and rationale.
- Interfaces over anonymous types when naming enriches clarity and reuse.
- No path aliases; always use relative ES module imports.
- Formatting and style: 2-space indent, semicolons on, double quotes.

> Core mantra: “Fix your types first.” If types are too complicated, simplify the code.

## Space Flight Physics

- Ship movement is momentum-based and unconstrained by a top speed cap in space mode; remove max-speed clamps from player controls.
- Boost modifies acceleration only (2x acceleration while held); it does not raise or lower any speed cap.
- Apply a light, continuous drag in space so velocity decays over time without input.
- Planet/star gravity acts as acceleration toward bodies and is independent of any ship speed considerations.
- Planet mode uses walking-style movement (direct velocity set) and can keep run/walk semantics.
