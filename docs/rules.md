# Team Rules and Coding Preferences

This project: L.O.S.E. — Lots of Outer Space to Explore (Vite + React + TypeScript). The world renders on an HTML5 canvas; menus/HUD are React. No server required.

## Core Principles

- Types first: fix types before running, testing, or shipping.
- Never hide type problems: no casts, no `any`, no ts‑ignores.
- Prefer clarity and simplicity over cleverness; rewrite if types/code are too complex.

## TypeScript Rules

- Strict TypeScript across the repo.
- Absolutely do not use `any` (including `as any`). Use `unknown` if needed and refine properly.
- Do not use `@ts-ignore` or `@ts-expect-error` to paper over issues.
- Casting is considered banned (`as X`, `as unknown as X`, etc.). If an exceptional case arises, it must be justified and approved.
  - Exception: `as const` on literal values (e.g., string or tuple literals) is allowed to preserve literal types, especially for discriminants or readonly structures. Prefer designing APIs that infer these automatically; use this sparingly and only for literals.
  - Tests exception: Test files (`*.test.ts[x]`) may use casts when needed to simulate broken or partial states, create minimal fakes, or coerce values for setup. Use casts responsibly and locally within tests; production code must still fix types instead of asserting.
- Using `satisfies` is a smell. Only in rare, justified cases and with explicit approval.
- Avoid TypeScript getters/setters in production code; prefer explicit methods like `getX()` / `setX(...)`. This makes call sites unambiguous and avoids surprising property semantics.
- Prefer named interfaces/types over anonymous object types.
  - Especially for function return types: define a named interface/type instead of returning anonymous object literals.
- Treat acronyms/initialisms as normal words: `someHtmlThing`, `JsonParser`, etc.
- Prefer named exports over default exports.
- Behavior Tree blackboards must be strongly typed per domain. Do not use index signatures or `unknown` bags on blackboards. Make BT primitives generic over a concrete blackboard type (e.g., `Node<EnemyBlackboard>`) and declare fields explicitly (including any `scratch` struct if needed).

## Code Style & Conventions

- 2-space indentation; semicolons on; double quotes.
- File naming (preferred; not fully migrated/enforced yet):
  - Single‑export modules should be named exactly after the primary export. Examples:
    - `export interface Player { … }` lives in `Player.ts` (auxiliary types like `PlayerState` may co‑live and export from the same file).
    - `export function createUser() { … }` lives in `createUser.ts`.
    - React components live in files that match the component name, e.g., `HudPanel.tsx`.
    - Hooks follow their function name, e.g., `useGameLoop.ts`.
  - Multi‑export utility modules (where many helpers/constants make sense together) use `kebab-case`, e.g., `math-utils.ts`.
  - Note: The codebase has not been fully migrated to this system yet; use it for new/changed files and we’ll refactor later.
  - Previous guidance that all files be `kebab-case.ts[x]` is superseded by this system.
- Prefer interfaces over anonymous types; avoid path aliases (use relative imports).
- UI uses Tailwind. Target a “control panel” HUD aesthetic (not webby).
- Whitespace is your friend. Be readable.

## Testing Guidelines

- Framework: Vitest; UI via React Testing Library.
- Name tests `*.test.ts[x]`; colocate with code or under `tests/`.
- Target ≥80% coverage on changed code.
- Include integration tests for systems (e.g., physics step, collision pass).
- Do not freeze design to preserve old tests. If a refactor improves clarity or architecture, refactor the code and update or replace the tests to match the new behavior. Tests serve the code, not the other way around.

## End-of-Task Checks (Required)

- Always run `npm run typecheck`, `npm run lint`, and `npm run test` before finishing a task or opening a PR. All must be clean. If any fails, fix issues first — do not ship or request review with failures.

## Commit & PR Guidelines

- Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`.
- Subject in imperative mood (≤72 chars), optional body with context.
- PRs should include: clear description, linked issues (`Closes #123`), screenshots for UI, steps to verify, risks/rollback notes.
- CI must pass build, typecheck, lint, tests.

## Security & Configuration

- Never commit secrets. If env vars are needed, provide `.env.example`.
- `.gitignore` must include `node_modules/`, `dist/`, coverage artifacts, and editor files.

## React/Hooks Preferences

- Components return `JSX.Element` or `JSX.Element | null` explicitly.
- Stabilize `useEffect` deps (avoid object identity churn); destructure props/state as needed.
- Prefer small, focused components with typed props.

## Rendering & Game Loop

- Canvas renderers and systems expose clear, named interfaces for their inputs/outputs.
- The core loop (`GameLoop`) has explicit return types on all methods.
- Avoid anonymous returns for ECS queries; define view types (e.g., `PlayerView`, `EntityCounts`).

## What To Do When Types Fight Back

1. Do not cast, do not ignore. Fix the types.
2. If the types are hard to model, the code is probably too complex—simplify.
3. Introduce named types/interfaces where it clarifies the contract.
4. If you believe an exception is necessary (`satisfies`, a cast), write down the rationale and get explicit approval before merging.
5. IF YOU GET STUCK ON TYPES AND ARE HAVING TROUBLE FIGURING IT OUT, ASK ME! I know TypeScript. I'm pretty good at it. Check with me instead of writing and re-writing types over and over trying to get it green. I'll probably have some advice.

---

These rules reflect the project owner’s preferences and are enforced during review. When in doubt, fix the types first.
