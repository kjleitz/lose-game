# Troubleshooting

Common issues and quick fixes.

Vitest picks up Playwright tests

- Symptom: errors like "Playwright Test did not expect test() to be called here".
- Fix: `vitest.config.ts` should exclude `e2e/**` and `tests-examples/**`.

Type errors differ in CI vs local

- Ensure Node matches LTS locally (`nvm use --lts`).
- Clear caches: `rm -rf node_modules dist .turbo` (if present), `npm ci`.

Playwright cannot connect / blank page

- Ensure `webServer` is configured in `playwright.config.ts`.
- Check port 4173 free, or set `PLAYWRIGHT_BASE_URL`.
- Review uploaded CI artifact `playwright-report/` for details.

PlanetSVG casing error (TS1261)

- On case‑sensitive filesystems, the import path must match filename case: `PlanetSvg`.

Tinypool / worker errors locally

- Try running a subset: `vitest run src/ui/components/Hud.test.tsx`.
- Ensure your Node is current LTS; close other heavy processes.
