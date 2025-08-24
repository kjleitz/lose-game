# HUD Structure

The HUD contains all UI elements outside the playable "universe" (canvas world). It is built from small, pure React components with Tailwind styling.

Top‑Level

- `src/ui/hud/Hud.tsx`
  - Composes HUD elements and positions them over the canvas.
  - Child areas:
    - Bottom‑left: `StatusPanel` (HP, XP/Score)
    - Top‑right: `ControlsPanel` (Settings, speed, actions, pause)
    - Bottom‑right: `Radar`
    - Top‑center: `Notification`

Panels

- `src/ui/hud/panels/StatusPanel.tsx` — HP + XP bars.
- `src/ui/hud/panels/ControlsPanel.tsx` — Settings, speed control, action readout, pause indicator.

Components

- `src/ui/hud/components/HealthBar.tsx` — HP bar (`hud-health-panel`).
- `src/ui/hud/components/ExperienceBar.tsx` — XP bar (wrap has `hud-score-panel`; inner has `hud-experience-panel`).
- `src/ui/hud/components/ActionReadout.tsx` — Joins active actions or shows "idle".
- `src/ui/hud/components/PauseIndicator.tsx` — Shows "paused".
- `src/ui/hud/components/SettingsButton.tsx` — HUD settings trigger.
- `src/ui/hud/components/Notification.tsx` — Top‑center messages.
- `src/ui/hud/components/Radar.tsx` — Minimap using `RadarService`.

Conventions

- Small, pure components with clear, typed props.
- Stable `data-testid` for E2E and component tests.
- Styling via Tailwind HUD tokens (`hud-*`), see `tailwind.config.ts` and `src/index.css`.
- Planets and other world visuals are part of the environment (not HUD) and live under `src/ui/components` and `src/domain/**`.

Related

- Testing strategy: docs/testing.md
- Architecture: docs/architecture.md
