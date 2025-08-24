# Performance Guide

Goals

- Keep the game loop smooth (aim 60 FPS).
- Minimize React re‑renders; keep canvas drawing efficient.

Canvas/world

- Batch draw operations in renderers; avoid per‑frame object churn.
- Prefer numeric math over allocating vectors; reuse arrays where possible.
- Consider culling for off‑screen objects; coarse grids for collisions.
- Explore `OffscreenCanvas` for workers when needed (future).

React/HUD

- Keep components pure and small; lift state to hooks.
- Pass primitive props when possible; memoize where value.
- Use `pointer-events-none` on non‑interactive overlays.
- Defer expensive calculations to domain services (e.g., `RadarService`).

Game loop

- Use `requestAnimationFrame` cadence in `GameLoopProvider`.
- Clamp `dt` to avoid large physics steps after tab inactivity.
- Decouple update and render so HUD can remain responsive.

Diagnostics

- Add lightweight FPS counter or frame budget logs behind a dev flag.
- Profile canvas with browser performance tools; record frame timelines.
