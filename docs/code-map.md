# Code Map

High‑level map of important modules and their responsibilities.

Top‑level

- `src/` — application code.
- `e2e/` — Playwright tests.
- `docs/` — documentation & ADRs.

UI

- `src/ui/components/`
  - `CanvasRoot.tsx` — mounts canvas + HUD; wires hooks and providers.
  - `CanvasRenderer.tsx` — canvas element + delegates to domain renderers.
  - `GameLoopProvider.tsx` — requestAnimationFrame loop, calls `update`/`render`.
  - `PlanetSvg.tsx` — planet vector renderer for HUD radar.
  - `SettingsModal.tsx`, `SpeedControl.tsx` — common UI.
- `src/ui/hud/`
  - `Hud.tsx` — unified HUD overlay.
  - `components/` — `HealthBar`, `ExperienceBar`, `ActionReadout`, `PauseIndicator`, `SettingsButton`, `Notification`, `Radar`.
  - `panels/` — `StatusPanel`, `ControlsPanel`.
- `src/ui/hooks/`
  - `usePlayer.ts` — Player instance + position state + persistence.
  - `usePlanets.ts` — planet list + region generation.
  - `useInput.ts` — keyboard state → `Set<string>` of actions.

Domain (game logic + rendering services)

- `src/domain/game/`
  - `player.ts` — Player model & physics update.
  - `GameSession.ts` — orchestrates one frame’s update.
  - `planets.ts` & generators — planet data & content.
- `src/domain/render/`
  - `GameRenderer.ts` & specific renderers — draw world to canvas.
  - `camera.ts` & transforms — world ↔ screen mapping.
- `src/domain/services/`
  - `RadarService.ts` — math for HUD radar positions & edge arrows.

Tests

- Vitest unit/component: `src/**/**.test.ts[x]`.
- Playwright E2E: `e2e/**.spec.ts`.
