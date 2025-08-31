# Proposed Folder Structure for Domain-Driven Design (DDD)

This proposal restructures the project to better align with DDD principles, improving separation of concerns, scalability, and maintainability. The new structure organizes code by domain, application, infrastructure, and UI layers.

## Proposed Structure

```
/lose-game
├── docs/
│   └── proposed-ddd-structure.md   # This file
├── src/
│   ├── domain/                     # Core business logic and models
│   │   ├── game/                   # Game session, player, planet, radar, etc.
│   │   ├── render/                 # Rendering logic (Camera, Ship, Planet, Starfield)
│   │   └── services/               # Domain services (e.g., RadarService)
│   ├── application/                # Application layer (use cases, orchestrators)
│   │   └── game/                   # Game session management, input handling, etc.
│   ├── infrastructure/             # Technical details (data access, external APIs, persistence)
│   │   └── assets/                 # Static assets (images, SVGs)
│   ├── ui/                         # Presentation layer (React components, hooks)
│   │   ├── components/             # UI components (Canvas, Hud, Notification, etc.)
│   │   └── hooks/                  # Custom React hooks
│   ├── shared/                     # Shared utilities, types, constants
│   └── main.tsx                    # App entry point
├── public/                         # Public static files
├── ...existing config files...
```

## Refactor Recommendations

1. **Domain Layer**
   - Move all core business logic and models (e.g., `GameSession`, `player.ts`, `planetManager.ts`, etc.) into `src/domain/game/`.
   - Move rendering logic (e.g., `CameraTransform.ts`, `ShipRenderer.ts`) into `src/domain/render/`.
   - Move domain services (e.g., `RadarService.ts`) into `src/domain/services/`.

2. **Application Layer**
   - Create orchestrators and use cases (e.g., game session management, input handling) in `src/application/game/`.
   - Move logic that coordinates domain models and services here.

3. **Infrastructure Layer**
   - Move static assets (images, SVGs) to `src/infrastructure/assets/`.
   - Add modules for data access, persistence, or external APIs as needed.

4. **UI Layer**
   - Move React UI to role-based areas under `src/ui/` (`shell`, `hud`, `overlays`, `controls`, `icons`).
   - Move hooks to `src/ui/hooks/`.
   - Keep UI logic separate from domain/application logic.

5. **Shared Layer**
   - Move utilities, types, and constants used across layers to `src/shared/`.

## Example Refactors

- `src/game/GameSession.ts` → `src/domain/game/GameSession.ts`
- `src/domain/render/ShipRenderer.ts` → `src/domain/render/ShipRenderer.ts` (no change)
- `src/ui/CanvasRenderer.tsx` → consolidated into `src/ui/shell/CanvasRoot.tsx` and domain renderers
- `src/ui/hooks/usePlayer.ts` → `src/ui/hooks/usePlayer.ts` (no change)
- `src/assets/react.svg` → `src/infrastructure/assets/react.svg`
- `src/engine/loop.ts` → `src/application/game/loop.ts`
- `src/engine/inputManager.ts` → `src/application/game/inputManager.ts`
- `src/engine/utils.ts` → `src/shared/utils.ts`

## Migration Steps

1. Create new folders as per the proposed structure.
2. Move files to their respective new locations.
3. Update import paths throughout the codebase.
4. Refactor code to ensure separation of concerns between layers.
5. Update documentation to reflect the new structure.

---

This structure will help the project scale, clarify responsibilities, and make future development easier. Please review and discuss before proceeding with migration.
