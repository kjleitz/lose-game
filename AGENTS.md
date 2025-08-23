# Repository Guidelines

These guidelines apply to L.O.S.E.: Lots of Outer Space to Explore — a Vite + React + TypeScript browser game. The world renders on an HTML5 canvas; menus/HUD use React. No server required.

## Project Structure & Modules

- `src/app/` — app bootstrap (Vite entry, providers)
- `src/ui/` — HUD and menus (React/tailwind)
- `src/game/` — game state, scenes, content
- `src/engine/` — loop, renderer, physics, collision, input
- `src/{assets,config,types,utils}/` — helpers and data
- `tests/` — unit/integration tests; `public/` — static files

## Build, Test, and Dev Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — serve build locally
- `npm run test` — run Vitest (watch in dev)
- `npm run coverage` — Vitest with coverage
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint; `npm run format` — Prettier

## Coding Style & Conventions

- TypeScript strict; 2-space indent; semicolons on; single quotes.
- Filenames: `kebab-case.ts[x]`; components: `PascalCase`; hooks: `useX`.
- No path aliases; use relative ES module imports.
- Lint/format via ESLint + Prettier; pre-commit hooks via Husky + lint-staged.
- UI uses Tailwind; aim for a “control panel” HUD look, not webby.

## Testing Guidelines

- Framework: Vitest; components via React Testing Library.
- Name tests `*.test.ts` / `*.test.tsx`; colocate near code or in `tests/`.
- Target ≥80% coverage on changed code; include integration tests for systems (e.g., physics step, collision pass).

## Commit & PR Guidelines

- Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`.
- Subject in imperative mood (≤72 chars), optional body with context.
- PRs: clear description, linked issues (`Closes #123`), screenshots for UI, steps to verify, and risks/rollbacks. CI (build/typecheck/lint/test) must pass.

## Security & Configuration

- Do not commit secrets. Provide `.env.example` if env vars are needed.
- `.gitignore` should include `node_modules/`, `dist/`, coverage artifacts, and editor files.
