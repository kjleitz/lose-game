# ADR-0010: UI Architecture and Folder Structure

Status: Proposed
Date: 2025-08-30
Decision Makers: Development Team
Supersedes: Prior draft of ADR-0010 (folder refactor)

## Context

The current `/src/ui/` has overlapping categories and ambiguous buckets that make navigation and refactoring harder:

- Top-level `components/` sits beside `hud/` and `app/`, but also duplicates categories inside `hud/` (e.g., `components/` vs `panels/`).
- Non-React utilities (e.g., canvas rendering) live under UI.
- Tests are not consistently colocated.
- Deep relative imports appear because there are no clear public boundaries per UI area.

This ADR replaces the previous proposal with a structure that sets clear roles, avoids generic buckets, and scales with the game’s HUD-first UI.

## Decision

Adopt a role- and feature-oriented UI structure. No top-level `components/` bucket. Each area exposes a small public surface via an `index.ts` barrel to keep imports shallow without aliases.

```
src/ui/
├─ shell/                 # App shell for React UI around the canvas
│  ├─ AppShell.tsx        # Layout, global chrome
│  ├─ CanvasRoot.tsx      # Hosts the HTML5 canvas
│  └─ providers/          # Context/providers e.g., GameLoopProvider
├─ hud/                   # In-game HUD system (feature)
│  ├─ HudRoot.tsx         # Composition point for HUD
│  ├─ layout/             # Grid/anchors/positioning helpers
│  ├─ panels/             # Dockable/grouped surfaces (InventoryPanel, MapPanel)
│  ├─ widgets/            # Atomic HUD widgets (Radar, XP bar, meters)
│  ├─ hooks/
│  └─ index.ts            # Public HUD exports
├─ overlays/              # Cross-screen overlays
│  ├─ dialogs/            # Modal dialogs (SettingsDialog)
│  ├─ menus/              # Menus (PauseMenu)
│  └─ toasts/             # Ephemeral notifications
├─ controls/              # Reusable UI controls (not HUD-specific)
│  ├─ primitives/         # Button, Slider, Toggle, etc.
│  └─ composites/         # Control groups (SpeedControl, KeyBindingField)
├─ hooks/                 # Cross-cutting UI hooks
├─ icons/                 # SVG/icon components (optional)
├─ theme/                 # UI tokens (z-index, sizes), Tailwind helpers
└─ index.ts               # Optional UI-wide barrel
```

Notes:

- Keep rendering/canvas utilities under `src/domain/render/` (not under UI).
- Prefer colocated tests (`*.test.tsx`) beside their components.
- Use barrels (`index.ts`) per area to keep imports short without path aliases.

## Rationale

- Clarity: Removes the ambiguous `components/` bucket; every item lives in a feature or role folder.
- HUD cohesion: HUD contains all of its parts (widgets, panels, layout, hooks) without sibling duplication.
- Separation: Overlays (dialogs/menus/toasts) are distinct from HUD so game-state UI and navigation UI evolve independently.
- Reuse: Reusable inputs live in `controls/` with clear granularity (`primitives` vs `composites`).
- Scalability: Area barrels define stable public surfaces, reducing deep imports and easing refactors.

## Mapping (representative)

- `src/ui/components/SettingsModal.tsx` → `src/ui/overlays/dialogs/SettingsModal.tsx`
- `src/ui/hud/components/ExperienceBar.tsx` → `src/ui/hud/widgets/ExperienceBar.tsx`
- `src/ui/hud/components/Notification.tsx` → If HUD-only: `src/ui/hud/widgets/Notification.tsx`; if global: `src/ui/overlays/toasts/Notification.tsx`
- `CanvasRoot.tsx` (if present under `components/`) → `src/ui/shell/CanvasRoot.tsx`
- `GameLoopProvider.tsx` (if present under `components/`) → `src/ui/shell/providers/GameLoopProvider.tsx`
- `SpeedControl.tsx` (if present) → `src/ui/controls/composites/SpeedControl.tsx`
- `PlanetCanvas.ts` (non-React) → `src/domain/render/PlanetCanvas.ts`

Tests follow their components (e.g., `ExperienceBar.test.tsx` beside `ExperienceBar.tsx`).

## Boundary & Import Rules

- UI must not import ECS internals. Prefer selectors/services exposed from `application` or stable facades under `domain`.
- No path aliases. Use area barrels to shorten relative imports (e.g., `import { HudRoot } from "../hud"`).
- Shared visual primitives live in `controls/primitives`; if something isn’t widely reused, keep it with its feature.

## Implementation Plan

Phase 0 — Create folders and barrels

- Add `src/ui/shell`, `src/ui/hud/{widgets,panels,layout,hooks}`, `src/ui/overlays/{dialogs,menus,toasts}`, `src/ui/controls/{primitives,composites}` and `index.ts` barrels per area.

Phase 1 — Move obvious files (no renames in code)

- Move HUD leaf components from `hud/components` → `hud/widgets`.
- Move `SettingsModal` → `overlays/dialogs/SettingsDialog` (rename file, keep export name temporarily to minimize churn).
- Move `PauseMenu` (if present) → `overlays/menus/PauseMenu`.
- Move shared controls (e.g., `SpeedControl`) → `controls/composites`.
- Move non-React canvas utilities (e.g., `PlanetCanvas.ts`) → `domain/render`.
- Colocate tests.

Phase 2 — Update imports to use barrels

- Add `index.ts` per area (hud, overlays, controls, shell). Export only stable components.
- Update imports within `src/ui` to consume area barrels.

Phase 3 — Tighten boundaries

- Replace any deep imports from `application`/`domain` with imports from stable facades.
- Document any remaining exceptions and create follow-up issues.

## Consequences

- Positive: Clear ownership per area, fewer ambiguous folders, simpler imports, easier onboarding.
- Neutral: Some file renames (e.g., `SettingsModal` → `SettingsDialog`) may touch tests and snapshots.
- Negative: Short-lived churn updating imports and resolving merge conflicts during migration.

## Alternatives Considered

- Keep `components/` at the top level — rejected (category overlap and ambiguity).
- Strict feature-slice for all UI — rejected (HUD and overlays share primitives; role+feature mix is more pragmatic here).
- Flat directory — rejected (does not scale for HUD-heavy UI).

## Validation

- Vitest should pass with colocated tests after moves.
- Lint passes with no path aliases and updated import paths.
- Manual smoke test: HUD renders (widgets and panels), overlays open/close, providers initialize.
