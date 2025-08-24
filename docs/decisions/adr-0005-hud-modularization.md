# ADR-0005: HUD Modularization and Structure

## Status

Accepted (2025-08-23)

## Context

The original HUD and HudPanel components had overlapping responsibilities and confusing names. As the HUD expands (status, controls, minimap, notifications), we need clear boundaries and small, testable pieces.

## Decision

- Replace `Hud` and `HudPanel` with a unified `Hud` container under `src/ui/hud/`.
- Split HUD into small components and panels:
  - Panels: `StatusPanel`, `ControlsPanel`.
  - Components: `HealthBar`, `ExperienceBar`, `ActionReadout`, `PauseIndicator`, `SettingsButton`, `Notification`, `Radar`.
- Keep environment visuals like `PlanetSvg` outside HUD.
- Provide stable `data-testid` selectors for HUD E2E/component tests.

## Consequences

- Easier to extend HUD without growing single files.
- Clear ownership and naming reduce coupling and confusion.
- Tests remain stable due to explicit selectors and pure components.
