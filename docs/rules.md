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

> Direct quote for emphasis: "GET RID OF THE LEGACY STUFF. Things SHOULD NOT hang around JUST TO SATISFY TESTS. Tests are there to validate your application. Your application is NOT THERE TO VALIDATE THE TESTS."

## Style and Naming

- No one-letter identifiers. Use descriptive variable, parameter, and function names for readability.
- Allowed exceptions: loop indices `i`/`j`/`k` and coordinates `x`/`y`.
- ESLint enforces `id-length` with min 2, excluding properties; `_` is allowed as a throwaway placeholder.
- Tests are allowed to use short identifiers when it meaningfully improves brevity (e.g., tiny helpers); the linter permits this only in `*.test.ts[x]` files.
- Vendored or internal library code under `src/lib/**` is ignored by the linter; keep local app code clean.
- For canvas transforms, avoid `a..f`—prefer descriptive names (e.g., `m11`, `m12`, `dx`, `dy`).
