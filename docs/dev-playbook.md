# Dev Playbook

Practical tips for day‑to‑day development, debugging, and validation.

Run & Build

- Dev server: `npm run dev` (Vite).
- Typecheck: `npm run typecheck`.
- Lint/format: `npm run lint` / `npm run format`.
- Build: `npm run build` (tsc build + Vite build).

Tests

- Unit/component (Vitest): `npm run test` (non‑interactive CI mode) or `vitest` in watch if preferred.
- Coverage: `npm run coverage` (text + HTML report).
- E2E (Playwright): `npm run e2e` (or `npx playwright test`).
- Open E2E report: `npm run e2e:report`.

Useful test patterns

- Run a single file: `vitest run src/ui/hud/Hud.test.tsx`.
- Focus a test: temporarily use `it.only(...)` locally; CI forbids `.only`.
- JSDOM quirks: mock canvas per ADR‑0004; avoid accessing layout APIs.

Debugging

- React HUD: prefer small, pure components; use React DevTools to inspect props/state.
- Canvas world: log draw calls sparingly; prefer frame counters or debug overlays drawn by the renderer.
- Game loop: add temporary `console.debug` in `GameLoopProvider` and `GameSession.update` to trace timings.
- Input: inspect `actions` from `useInput()`; tests can inject `Set<string>`.

Persisted settings

- Speed multiplier: `localStorage['lose.speedMultiplier']`.
  - Reset: `localStorage.removeItem('lose.speedMultiplier')`.

Troubleshooting quick reference

- Vitest picks up E2E: verify `vitest.config.ts` exclude includes `e2e/**`.
- Playwright can’t connect: ensure `webServer` is configured (see playwright.config.ts) and port not in use.
- Type mismatch between local/CI: ensure Node LTS locally (`nvm use --lts`).
