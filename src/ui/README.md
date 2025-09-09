# src/ui/

React-based user interface for the game. All UI rendering happens here while game world rendering occurs on canvas.

## Structure

- **`shell/`** - App shell, layout components, and core providers (game loop, canvas root)
- **`hud/`** - In-game HUD with panels, widgets, and layout components
- **`overlays/`** - Modal dialogs and menus (settings, perks) that pause the game
- **`controls/`** - Reusable UI primitives (buttons, sliders) and composite components
- **`hooks/`** - Custom React hooks for UI logic
- **`icons/`** - SVG icon components

## Key Concepts

**Pause Behavior**: Opening any overlay menu automatically pauses the game. The pause state is managed centrally in `shell/CanvasRoot.tsx`.

**Visual Style**: All HUD panels and overlay menus use the shared `hud-panel` CSS class for consistent styling. Individual components only add spacing and positioning.

**No Top-Level Components**: There's no generic `components/` folder. Components are organized by their specific role and feature area.

## Testing

Components are tested with React Testing Library. Test files are colocated next to components as `*.test.tsx`.
