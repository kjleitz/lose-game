# ADR-0012: Map Maker Refactor and Feature Completion Plan

## Status

Proposed

## Context

The map-maker tool (src/tools/map-maker) was initially implemented by a junior developer and largely matches the intent described in ADR-0011, but there are notable gaps and architectural smells:

- Event lifecycle bugs: canvas/document listeners added with bound functions are not removable; canvas is not focusable, so keyboard shortcuts rarely work.
- History/actions incomplete: `executeAction`, `undoAction`, `getFeatureById` are placeholders; clipboard and select-all cannot function.
- State reactivity gaps: React UI (toolbar, cursor) does not subscribe to engine state, so Undo/Redo and cursor updates are stale.
- Tool property disconnect: UI exposes properties but the editors use hard-coded values.
- Duplication: two ship editors (`ShipEditor` vs `EnhancedShipEditor`); repeated id/geometry helpers; duplicate throttling (engine + preview renderer).
- Rendering/data coupling: engine stores a wall-specific preview; sizing is split between engine config and React props; no devicePixelRatio scaling.
- Layer panel features are stubs; renderers don’t respect visibility/lock/opacity.
- Type looseness: some engine events use `unknown`; payloads should be precise per RULES.md.

This ADR defines a focused plan to refactor the system to align with project rules and complete core features with minimal churn.

## Decision

Adopt a phased refactor that preserves public surface (component entry points, project types) while improving cohesion, fixing input/state issues, and finishing critical features (history, clipboard, layers). Prioritize surgical, incremental changes with clear acceptance criteria.

## Goals

- Stable, leak-free input + keyboard shortcuts scoped to the canvas.
- Deterministic history (undo/redo) and working clipboard operations.
- Tool properties drive creation logic (no hard-coded sizes/types).
- One ship editor path (use EnhancedShipEditor) with room detection.
- Layers panel controls change state and are respected by renderers.
- Rendering quality improvements (HiDPI) and unified sizing.
- Tighter event typings consistent with RULES.md.

## Non-Goals (for this ADR)

- Full-featured planet heightmap editing pipeline.
- Project browser/import UI (beyond existing Save/Export).
- Major redesign of rendering architecture.

## Plan (Phased)

Phase 1 — Input & Lifecycle (stability)

- Store bound listener refs on MapMakerEngine; add/remove the exact same functions in setup/cleanup.
- Make canvas focusable (`tabIndex=0`) and focus on pointer down. Scope keyboard shortcuts to focused canvas.
- Centralize middle-button panning (either via engine or MapCanvas, but not both); use incremental deltas.
- Tighten EngineEventMap payload types (remove `unknown`; e.g., `selectionUpdate: string[]`, `selectAll: {}`).

Acceptance:

- No console warnings on unremoved listeners; keyboard shortcuts work after clicking the canvas; middle-drag pans smoothly.

Phase 2 — UI Reactivity (feedback)

- In MapCanvas/toolbar, subscribe to `toolChanged` and `historyChanged`; minimal React state reflects `currentToolId` and `canUndo/Redo`.
- Cursor updates immediately on tool change.

Acceptance:

- Undo/Redo buttons enable/disable correctly; cursor changes with active tool.

Phase 3 — Consolidate Ship Editor (cohesion)

- Replace `ShipEditor` usage with `EnhancedShipEditor` in `MapMaker.tsx`.
- Remove/deprecate the legacy `ShipEditor` to prevent drift.

Acceptance:

- Wall drawing preview + room detection are available; no dead/duplicated editor code paths.

Phase 4 — Tool Properties (correctness)

- Store current tool properties in MapMakerEngine; expose getters (narrowed) and a change event.
- Update wall/door/station creation to pull from engine properties rather than hard-coded values.

Acceptance:

- Changing thickness/door width/radius in the panel affects created objects.

Phase 5 — History + Feature Index (undo/clipboard)

- Maintain a feature index (id → {layer,type,ref}) for the active project.
- Implement `getFeatureById`, `executeAction`, `undoAction` for add/remove/modify/move.
- Make copy/paste/delete/select-all operate via actions; enforce mode consistency on clipboard.

Acceptance:

- Copy/paste/delete reliably modifies the project; Undo/Redo reverts/applies those edits.

Phase 6 — Layers (visibility/lock/opacity)

- Extend project to persist layer state (visible, locked, opacity, order) in a mode-appropriate structure.
- Implement LayerPanel handlers and make Grid/Preview renderers respect layer state.

Acceptance:

- Toggling visibility/lock/opacity affects rendering and input; reorder updates draw order.

Phase 7 — Rendering Polish (quality/perf)

- Add devicePixelRatio-aware canvas scaling; adapt grid/preview calculations.
- Unify sizing: source element’s measured size → engine update; remove redundant preview throttling (keep one throttle point).

Acceptance:

- Crisp lines on HiDPI; no duplicated throttling; canvas size changes remain in sync.

## Technical Notes

- Follow RULES.md strictly: no `any`, no casts; precise event payload types.
- Prefer tool-owned preview state. Engine may expose a generic preview channel if needed (discriminated union), but the wall tool already provides `getPreviewWall()`.
- Extract shared utilities:
  - `src/tools/map-maker/utils/id.ts` → `createId(prefix: string): string`.
  - `src/tools/map-maker/utils/geom.ts` → line distance, bounds, projection helpers.
- Keep changes localized; avoid renaming public exports unless part of Phase 3 removal.

## Risks and Mitigations

- Event refactor regressions: add small, targeted tests or manual steps; keep handlers namespaced; verify cleanup on unmount.
- Action/undo correctness: start with add/remove; expand to modify/move once baseline is stable.
- Layer state persistence: define minimal layer metadata structure; adapt renderers incrementally.

## Migration Steps

- Swap EnhancedShipEditor in `MapMaker.tsx` (Phase 3). Remove `ShipEditor.tsx` after verification.
- Introduce utils modules; replace duplicated id/geometry code opportunistically.
- Update event typings and usages across engine, MapCanvas, editors.

## Acceptance Criteria Summary

- Keyboard shortcuts work when canvas focused; no leaked listeners.
- Undo/Redo, Copy/Paste/Delete, Select All operate and are reversible.
- Tool properties change object creation outcomes.
- Layer toggles visibly affect rendering and input.
- HiDPI rendering is crisp; sizing is unified.

## Open Questions

- Should tool previews be standardized as a discriminated union on the engine, or remain tool-owned? Initial approach: tool-owned to reduce engine coupling.
- Do we need per-mode layer ordering persistence, or is a fixed order sufficient short-term? Proposal: persist per-mode order.

## Timeline and Priorities

1. Input + Lifecycle (P1)
2. UI Reactivity (P1)
3. Ship Editor consolidation (P1)
4. Tool Properties (P2)
5. History + Clipboard (P2)
6. Layers (P2)
7. Rendering Polish (P3)

---

Author: Map-Maker Refactor
Date: 2025-09-15
