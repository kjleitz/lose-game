# Glossary

- HUD: Heads‑Up Display. All UI not drawn in the game canvas.
- Universe/World: The playable space rendered on the HTML5 canvas.
- Player: Entity with position, velocity, angle, health, experience.
- Actions: Input flags (e.g., `thrust`, `turnLeft`, `boost`, `speedUp`).
- Game Loop: Update/render orchestration; see `GameLoopProvider` and `GameSession`.
- Renderer: Renders world to canvas; see `CanvasRenderer` and domain renderers.
- Camera: View transform for world → screen coordinates.
- Radar: HUD minimap showing player/planet positions.
- Notification: Transient HUD message for player feedback.
- Panel: Grouped HUD UI block, e.g., StatusPanel, ControlsPanel.
- ADR: Architecture Decision Record; design decisions and context.
