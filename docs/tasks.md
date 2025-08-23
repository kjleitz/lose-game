# Active Tasks

This file tracks the immediate sequence of implementation so any contributor (or AI) can resume work.

## Next Steps (ordered)

1. Loop: Add pause/resume and single-step controls for debugging.
2. Input: Implement action queue and consume per fixed tick for determinism.
3. Rendering: Add camera and world layers (background, entities, FX).
4. Player: Replace crosshair with simple ship sprite and render via a basic sprite system.
5. Physics: Add integration step and basic collision scaffold (grid-based broadphase + simple resolution).

## Notes

- Keep systems modular and pure where possible.
- Maintain tests: add unit tests for loop controls and input queue; smoke test for camera render path.
- Update ADRs if the architecture materially shifts.
- Debug defaults: `Esc` pauses/resumes; `` ` `` steps one fixed delta (1/60s by default).
- Visual defaults: ship is a triangle using HUD accent color.
