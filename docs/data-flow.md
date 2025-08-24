# Data Flow

This document explains how input, state updates, and rendering flow through the app each frame.

Per‑frame lifecycle

1. Input collection
   - `useInput()` updates `actions: Set<string>` from current keyboard/mouse.
2. Update (game logic)
   - `GameLoopProvider` calls `update(dt)` provided by `CanvasRoot`.
   - `GameSession.update(actions, updatePlayer, maybeGenerateRegion, dt)` advances the world:
     - `Player.update` applies thrust/turn/drag; updates position/angle/health/experience.
     - `maybeGenerateRegion` creates planets in new regions as camera/player move.
     - `notification` can be set based on events.
   - `usePlayer.updatePlayer` writes the latest `playerRef.state` into React state `playerPos`.
3. Render (world)
   - `CanvasRenderer` invokes domain renderers to draw the world on the canvas.
4. Render (HUD)
   - `Hud` reads props: `playerPos`, `planets`, `actions`, `notification` and renders panels/components.

State ownership

- Single source of truth for player physics is `Player` (class).
- React `playerPos` is a snapshot for rendering HUD.
- Planets live in `usePlanets` and domain planet modules.
- Input is represented as a `Set<string>` of action names (`thrust`, `turnLeft`, etc.).

Key threads

- World rendering in canvas is decoupled from React HUD updates.
- `pointer-events-none` on HUD root prevents accidental input capture, with exceptions for interactive panels/buttons.
