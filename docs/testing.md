# Testing Strategy

This project splits tests into fast unit/component tests (Vitest + JSDOM) and full end‑to‑end tests (Playwright + real browser).

- Unit/Component: Vitest (`src/**/*.test.ts[x]`, `tests/**`).
  - Environment: JSDOM.
  - Setup: `src/setupTests.ts` configures React Testing Library cleanup after each test.
  - Canvas: mocked per ADR-0004 for deterministic rendering tests.
  - Run: `npm run test` or `npm run coverage`.
  - Config: `vitest.config.ts` excludes `e2e/**` and `tests-examples/**`.

- E2E: Playwright (`e2e/**/*.spec.ts`).
  - Server: Vite preview via Playwright `webServer`.
  - Base URL: `http://localhost:4173` (override with `PLAYWRIGHT_BASE_URL`).
  - Browsers: Chromium, Firefox, WebKit.
  - Run: `npx playwright test`.
  - Open report: `npx playwright show-report`.

Selectors & Test IDs

- HUD root: `[data-testid="hud-root"]`
- HUD health: `[data-testid="hud-health-panel"]`
- HUD experience/score: `[data-testid="hud-experience-panel"]`, `[data-testid="hud-score-panel"]`
- Settings button: `[data-testid="hud-settings-button"]`

References

- ADR-0004: docs/decisions/adr-0004-testing-and-canvas-mock.md
- Playwright plan: docs/playwright-test-plan.md
