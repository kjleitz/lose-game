# Continuous Integration (CI)

CI is split into two workflows under `.github/workflows/`:

- `ci.yml` — Unit build pipeline (Node LTS):
  - Install: `npm ci`
  - Typecheck: `npm run typecheck`
  - Lint: `npm run lint`
  - Test (Vitest): `npm run test -- --run`
  - Build (Vite): `npm run build`

- `playwright.yml` — End‑to‑end tests:
  - Install: `npm ci`
  - Build: `npm run build`
  - Install browsers: `npx playwright install --with-deps`
  - Run E2E: `npx playwright test`
  - Upload report artifact: `playwright-report/`

Notes

- Node uses `lts/*` to track the latest LTS.
- Vitest intentionally excludes `e2e/**` so unit runs remain fast and deterministic.
- Playwright runs against a built preview server (`webServer` in `playwright.config.ts`).

Troubleshooting

- If E2E fails only on CI, check Playwright report artifact.
- If unit tests pick up E2E suites, verify `vitest.config.ts` include/exclude.
- If type errors differ locally vs CI, confirm local Node matches `lts/*`.
