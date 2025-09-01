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
