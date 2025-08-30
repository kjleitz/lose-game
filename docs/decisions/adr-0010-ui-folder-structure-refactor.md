# ADR-0010: UI Folder Structure Refactor

**Status:** Proposed  
**Date:** 2025-08-29  
**Decision Makers:** Development Team

## Context

The current `/src/ui/` folder structure has grown organically without clear organization principles, leading to several maintainability issues:

### Current Problems:

1. **Misplaced Test Files**
   - `Hud.test.tsx`, `Radar.test.tsx`, `Notification.test.tsx` in `/components/` but actual components are in `/hud/`
   - `HudPanel.test.tsx` in `/components/` but should be with panel components
   - Tests separated from their corresponding components

2. **Non-Component Files in UI Layer**
   - `PlanetCanvas.ts` is a canvas drawing utility function, not a React component
   - Canvas rendering utilities don't belong in the UI component folder
   - Should be moved to `/src/domain/render/` or similar

3. **Deep Import Paths**
   - Many files use imports like `../../../application/input/ActionTypes`
   - Cross-directory imports create tight coupling
   - Difficult to refactor without breaking multiple files

4. **Mixed Responsibilities in `/components/`**
   - Contains application-level components (`CanvasRoot`, `GameLoopProvider`)
   - Contains modal components (`SettingsModal`, `PauseMenu`)
   - Contains reusable controls (`SpeedControl`)
   - Contains domain-specific components (`PlanetSvg`)
   - No clear hierarchy of component types

## Decision

Restructure `/src/ui/` to follow clear separation of concerns:

```
src/ui/
├── app/                    # Application-level components
│   ├── CanvasRoot.tsx
│   ├── CanvasRoot.test.tsx
│   ├── GameLoopProvider.tsx
│   └── GameLoopProvider.test.tsx
├── components/             # Reusable UI components
│   ├── modals/
│   │   ├── SettingsModal.tsx
│   │   ├── PauseMenu.tsx
│   │   └── PauseMenu.test.tsx
│   ├── controls/
│   │   └── SpeedControl.tsx
│   └── game/               # Game-specific reusable components
│       ├── PlanetSvg.tsx
│       └── PlanetSvg.test.tsx
├── hud/                    # HUD system (maintain current structure)
│   ├── Hud.tsx
│   ├── Hud.test.tsx
│   ├── components/
│   └── panels/
└── hooks/                  # Custom hooks (maintain current structure)
```

## Rationale

1. **Clear Separation of Concerns:**
   - `/app/` for application entry points and providers
   - `/components/` for reusable UI components, organized by type
   - `/hud/` maintains its current good organization
   - `/hooks/` remains unchanged (already well-organized)

2. **Component Hierarchy:**
   - Application-level components isolated in `/app/`
   - Reusable components grouped by function (modals, controls, game-specific)
   - Domain-specific components (HUD) maintain their structure

3. **Test Organization:**
   - Tests colocated with components
   - Remove duplicate test files
   - Consistent test placement patterns

4. **Import Path Improvement:**
   - Shorter relative paths within UI layer
   - More predictable component locations
   - Easier refactoring

## Implementation Plan

### Phase 1: Fix Misplaced Files (High Priority)

- Move test files to correct locations alongside their components:
  - `Hud.test.tsx` → `/src/ui/hud/`
  - `Radar.test.tsx` → `/src/ui/hud/components/`
  - `Notification.test.tsx` → `/src/ui/hud/components/`
  - `HudPanel.test.tsx` → `/src/ui/hud/panels/` (rename appropriately)
- Move `PlanetCanvas.ts` to `/src/domain/render/` (not a UI component)
- Fix broken test references

### Phase 2: Restructure Directories (Medium Priority)

- Create new directory structure (`/app/`, `/components/modals/`, `/components/controls/`)
- Move React components to appropriate locations
- Update imports within UI layer

### Phase 3: Update External References (Low Priority)

- Update imports from other layers (`/application/`, `/domain/`)
- Can be done incrementally as files are modified

## Consequences

### Positive:

- **Maintainability:** Clear component organization
- **Developer Experience:** Easier to find and understand components
- **Testing:** Consistent test placement and no duplicates
- **Refactoring:** Shorter import paths, less coupling

### Negative:

- **Migration Effort:** Requires updating imports across codebase
- **Temporary Disruption:** May break some imports during transition
- **Learning Curve:** Team needs to learn new structure

### Risks:

- **Breaking Changes:** Imports will need updating
- **Merge Conflicts:** Active branches may conflict during migration

## Alternatives Considered

1. **Keep Current Structure:** Rejected due to growing maintenance burden
2. **Flat Structure:** Rejected as it doesn't scale with component growth
3. **Feature-Based Organization:** Rejected as UI components are shared across features

## Notes

This ADR addresses technical debt that has accumulated in the UI layer. The proposed structure follows React community conventions and will improve long-term maintainability.

The implementation can be done incrementally, starting with removing duplicates and fixing immediate issues, then gradually moving components to their new locations.
