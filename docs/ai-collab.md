# AI Collaboration Guide

This guide helps AI agents navigate, edit, and validate changes effectively.

Principles

- Prefer small, focused changes scoped to a feature.
- Follow file naming and style conventions (see AGENTS.md and CONTRIBUTING.md).
- Update or add tests when changing behavior; target ≥80% coverage on changed code.

Navigation

- Start with `docs/index.md`, then `docs/code-map.md`.
- HUD work: see `docs/hud.md` and `src/ui/hud/`.
- Game logic: `src/domain/game/` and `GameSession`.
- Rendering: `src/domain/render/` and `CanvasRenderer`.

Safety rails

- Respect `vitest.config.ts` include/exclude when adding tests.
- Use stable data‑testids for new HUD/components.
- When changing CI, update `docs/ci.md` and validate locally when possible.

Validation

- `npm run typecheck`, `npm run lint`, `npm run test`.
- For E2E: `npm run build` then `npm run e2e`.

Common tasks

- Add HUD subcomponent → place under `src/ui/hud/widgets` (or `panels` if it’s a grouped surface), export via area index if needed; add a unit test.
- New domain system → place under `src/domain/<area>`; provide pure functions or small classes; test deterministically.
