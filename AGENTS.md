# Repository Guidelines

These guidelines apply to L.O.S.E.: Lots of Outer Space to Explore — a Vite + React + TypeScript browser game. The world renders on an HTML5 canvas; menus/HUD use React. No server required.

## **DO NOT IGNORE: READ THE RULES DOC**

You MUST read `docs/rules.md` before starting ANY task. If I make it clear that I have a general code preference, you MUST record it in the rules doc. That document will make you a better programmer. Treat it like gospel.

## Project Structure & Modules

- `src/ui/` — HUD and menus (React/Tailwind)
- `src/application/` — app layer: loop orchestration and input
- `src/domain/` — core game logic: game state, rendering services, AI, services
- `src/engine/` — extracted engine primitives (core loop, input)
- `src/games/` — mode‑specific games (space, planet)
- `src/lib/ecs/` — internal ECS package used by systems
- `src/shared/` — shared helpers and types
- `src/infrastructure/` — assets and technical adapters
- `public/` — static files; `e2e/` — Playwright tests

## Build, Test, and Dev Commands

- `npm run dev` — start Vite dev server
- `npm run build` — production build
- `npm run preview` — serve build locally
- `npm run test` — run Vitest (watch in dev)
- `npm run coverage` — Vitest with coverage
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — ESLint; `npm run format` — Prettier

## Coding Style & Conventions

- TypeScript strict; 2-space indent; semicolons on; double quotes.
- Filenames: `kebab-case.ts[x]`; components: `PascalCase`; hooks: `useX`.
- Acronyms and initialisms should be treated like normal words in camelCase or PascalCase identifiers; e.g., someHtmlThing not someHTMLThing, JsonParser not JSONParser, etc.
- No path aliases; use relative ES module imports.
- Lint/format via ESLint + Prettier; pre-commit hooks via Husky + lint-staged.
- UI uses Tailwind; aim for a “control panel” HUD look, not webby.
- Whitespace is your friend. Be readable.
- Generally prefer interfaces over anonymous types.

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

## RULES YOU ABSOLUTELY MUST FOLLOW

- DO NOT USE `any`. YOU DO NOT HAVE TO USE `any`. If you are using `any`, you are adding a bug. I'm serious.
- If you are doing `as any`, you're doing it wrong. You should not need `as any`. Figure it out. Fix your types first. Your compiler is your best friend. I don't care what is happening in the browser if there are type errors in my code. Make it work. Do not resort to a band-aid like `any`. Use `unknown` if you have to, because that is what it's there for. Get an error with `unknown`? Good, that's what it's there for. When you fix that error, you will have solved a problem for yourself ahead of time. THIS IS YOUR GOSPEL.
- Just as bad as `any` is `@ts-ignore` and `@ts-ignore-error`. Never use any of these.
- IF YOU ARE CASTING, YOU ARE DOING IT WRONG. NO CASTING. You are very possibly hiding a bug. It's only a step up from `as any`. Doing `as X` is almost as bad. Doing `as unknown as X` is even worse than `as X`. Casting is only necessary in very rare cases. Consider it banned. **If it has to happen, you MUST make that argument to me and receive my confirmation that it be allowed in the codebase.**
- Using `satisfies` is smelly. If you are doing this, consider why you are doing it. If you're doing it because it seems like the only way to fix some type issue, then you are probably doing it wrong. This is useful in only very rare cases, in my opinion. **If it has to happen, you MUST make that argument to me and receive my confirmation that it be allowed in the codebase.**
- FIX YOUR TYPES FIRST. If you have type errors, do not put band-aids on them. Fix them. Every time you fix a type error, you are solving a problem ahead of time. If the types are too complicated, maybe the code is too complicated and you should rewrite it to be simpler. I don't want to see you testing or trying anything out if the types are broken. Fix them first, always.
