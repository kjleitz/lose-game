# Important Code Rules For This Project

These are the guiding principles for development in this repo. Keep them short, explicit, and enforceable.

## General Code Rules

### RULES YOU ABSOLUTELY MUST FOLLOW!

Agents, you must preserve the exact wording of the following bullet points.

- DO NOT USE `any`. YOU DO NOT HAVE TO USE `any`. If you are using `any`, you are adding a bug. I'm serious.
- If you are doing `as any`, you're doing it wrong. You should not need `as any`. Figure it out. Fix your types first. Your compiler is your best friend. I don't care what is happening in the browser if there are type errors in my code. Make it work. Do not resort to a band-aid like `any`. Use `unknown` if you have to, because that is what it's there for. Get an error with `unknown`? Good, that's what it's there for. When you fix that error, you will have solved a problem for yourself ahead of time. THIS IS YOUR GOSPEL.
- Just as bad as `any` is `@ts-ignore` and `@ts-ignore-error`. Never use any of these.
- IF YOU ARE CASTING, YOU ARE DOING IT WRONG. NO CASTING. You are very possibly hiding a bug. It's only a step up from `as any`. Doing `as X` is almost as bad. Doing `as unknown as X` is even worse than `as X`. Casting is only necessary in very rare cases. Consider it banned. **If it has to happen, you MUST make that argument to me and receive my confirmation that it be allowed in the codebase.**
- Using `satisfies` is smelly. If you are doing this, consider why you are doing it. If you're doing it because it seems like the only way to fix some type issue, then you are probably doing it wrong. This is useful in only very rare cases, in my opinion. **If it has to happen, you MUST make that argument to me and receive my confirmation that it be allowed in the codebase.**
- FIX YOUR TYPES FIRST. If you have type errors, do not put band-aids on them. Fix them. Every time you fix a type error, you are solving a problem for yourself ahead of time. If the types are too complicated, maybe the code is too complicated and you should rewrite it to be simpler. I don't want to see you testing or trying anything out if the types are broken. Fix them first, always.

### TypeScript Discipline

- Strict TypeScript only. Do not weaken types to "make it work". Fix types first.
- Never use `any`. If you think you need `any`, revisit the design. Prefer precise types; use `unknown` if necessary and narrow explicitly.
- Do not use `@ts-ignore` or `@ts-expect-error` as band-aids. Address the root cause.
- Avoid casting (`as T` or double-cast `as unknown as T`). Casting hides bugs and is only acceptable in rare, justified cases with prior maintainer approval.
- Be skeptical of `satisfies`. If it seems required, reevaluate the types or API. Only use with explicit reviewer approval and rationale.
- Interfaces over anonymous types when naming enriches clarity and reuse.
- No path aliases; always use relative ES module imports.
- Formatting and style: 2-space indent, semicolons on, double quotes.

### Nullish Checks

- Use `x == null` and `x != null` exclusively for nullish checks so both `null` and `undefined` are handled. Use `===`/`!==` everywhere else. ESLint is configured (`eqeqeq` with `{ null: "ignore" }`) to enforce this. Do not use `=== undefined` or `=== null` or `!== undefined` or `!== null`. If you must compare directly against a nullish value to exclude the other one, you're probably doing something wrong.
- Don't do `if (typeof someNullableString === 'string')`, do `if (someNullableString != null)`. You're masking other type issues when you use the former style.

> Core mantra: "Fix your types first." If types are too complicated, simplify the code.

### Style and Naming

- No one-letter identifiers. Use descriptive variable, parameter, and function names for readability.
- Allowed exceptions: loop indices `i`/`j`/`k` and coordinates `x`/`y`.
- ESLint enforces `id-length` with min 2, excluding properties; `_` is allowed as a throwaway placeholder.
- Tests are allowed to use short identifiers when it meaningfully improves brevity (e.g., tiny helpers); the linter permits this only in `*.test.ts[x]` files.
- For canvas transforms, avoid `a..f`—prefer descriptive names (e.g., `m11`, `m12`, `dx`, `dy`).

### Coding Style & Conventions

- TypeScript strict; 2-space indent; semicolons on; double quotes.
- Filenames should be named for the main exported thing in that file. If the file mainly exports a class called `FooBar`, then the file should be called `FooBar.ts` (even if it also exports a helper function named `createFooBar`, for instance). If the file mainly exports a function called `doThing` or a constant called `thingStore`, it should be called `doThing.ts` or `thingStore.ts`. Modules with no main export should be named a sensible categorical name in camelCase like `utils.ts` or `blahBlah.ts`.
- Acronyms and initialisms should be treated like normal words in camelCase or PascalCase identifiers; e.g., `someHtmlThing` not `someHTMLThing`, `JsonParser` not `JSONParser`, etc.
- No path aliases; use relative ES module imports.
- Lint/format via ESLint + Prettier; pre-commit hooks via Husky + lint-staged.
- Whitespace is your friend. Be readable.
- Generally prefer interfaces over anonymous types.

### Testing Philosophy

- Remove legacy code promptly. Do not keep old paths or duplicate logic "just in case" or to appease stale tests.
- Tests are there to validate the application. The application is not there to validate the tests.
  - If a test enshrines behavior we no longer want, change or delete the test alongside the code change.
  - Do not retain legacy code paths solely to keep tests green.
- Keep tests aligned with the intended product behavior. Prefer high-value, integration-style tests at stable boundaries.
- When refactoring, update tests to reflect the new design; do not preserve obsolete seams.
- We want comprehensive unit tests which test INTENDED behavior (not just EXISTING behavior... which may actually be broken in some cases! We'll find out when we write tests against INTENDED BEHAVIOR.)

> Direct quote for emphasis: "GET RID OF THE LEGACY STUFF. Things SHOULD NOT hang around JUST TO SATISFY TESTS. Tests are there to validate your application. Your application is NOT THERE TO VALIDATE THE TESTS."

### Testing Guidelines

- Framework: Vitest; components via React Testing Library.
- Name tests `*.test.ts` / `*.test.tsx`; colocate near code or in `tests/`.
- Target ≥80% coverage on changed code; include integration tests for systems (e.g., physics step, collision pass).

### Tooling Discipline

- Do not change ESLint rules unless explicitly instructed. Fix code and types to satisfy the existing configuration.

#### Mandatory Local Checks

- On every substantive change, run ALL three before handing off or opening a PR:
  - `npm run typecheck` — no TypeScript errors.
  - `npm run test` — tests pass (add or update as needed for changes).
  - `npm run lint` — lints pass without disabling rules.
- Formatting: if diff is messy, run `npm run format` to align with Prettier.

### Commit & PR Guidelines

- Conventional Commits: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`.
- Subject in imperative mood (≤72 chars), optional body with context.
- PRs: clear description, linked issues (`Closes #123`), screenshots for UI, steps to verify, and risks/rollbacks. CI (build/typecheck/lint/test) must pass.
- Describe the change, link issues (`Closes #123`).
- Include screenshots for UI changes (HUD panels, overlays).
- Note risks/rollbacks; ensure CI is green (typecheck/lint/unit/e2e as applicable).

### Security & Configuration

- Do not commit secrets. Provide `.env.example` if env vars are needed.
- `.gitignore` should include `node_modules/`, `dist/`, coverage artifacts, and editor files.

## Project Rules

### Architecture Migration

- When introducing a new architecture or subsystem (e.g., ECS planet mode), deprecate and remove the old implementation (e.g., legacy `PlanetGame`/`GameManager`) once the replacement is stable.
- Temporary duplication during migration is acceptable only with an explicit, near-term removal plan (tracked issue or PR checklist).
  - Current status: Legacy classes (`PlanetGame`, `SpaceGame`, `GameManager`, engine/core) have been removed. Modes are states inside `GameSessionECS` and share canonical `PlanetSurface` types.

### Enforcement

- PRs that add duplicate logic must include a removal plan (owner + date). Prefer extracting shared helpers over duplication.
  - Do not duplicate structural types (e.g., `PlanetSurface`) in renderers or systems; import the canonical type.

### World Coordinates

- Maintain distinct coordinate spaces for space and planet modes.
  - Player has separate x/y in space and x/y on a planet; do not mutate one while the other mode is active.
  - On landing, move the player to the planet-local landing site. Do not translate the surface to match space coordinates.
  - On takeoff, place the player hovering just outside the planet in space (near the planet's world position), not at an arbitrary prior approach vector.
  - Rendering and input operate in the active mode's space; camera follows the active position only.

### Death & Reset

- Player death is global: if HP reaches 0 in any mode or the player entity is destroyed, show a red overlay with "u ded" and an "alive?" button.
- Clicking "alive?" respawns into a fresh space session at the starting point.
- Only the saved session is wiped on respawn. Settings and keybindings persist.

### Input and Settings Changes

- If key bindings or settings change, provide a one-time migration for persisted data (e.g., remap old keys). Do not revert product changes to satisfy historical tests.

### Space Flight Physics

- Ship movement is momentum-based and unconstrained by a top speed cap in space mode; remove max-speed clamps from player controls.
- Boost modifies acceleration only (2x acceleration while held); it does not raise or lower any speed cap.
- Apply a light, continuous drag in space so velocity decays over time without input.
- Planet/star gravity acts as acceleration toward bodies and is independent of any ship speed considerations.
- Planet mode uses walking-style movement (direct velocity set) and can keep run/walk semantics.

### UI Structure & Conventions

- No top-level `components/` bucket under `src/ui/`. Organize by role and feature:
  - `src/ui/shell` for app shell, layout, providers (e.g., `CanvasRoot`, `GameLoopProvider`).
  - `src/ui/hud` for the in-game HUD with `widgets/`, `panels/`, `layout/`, and `hooks/` subfolders.
  - `src/ui/overlays` for dialogs, menus, and toasts not tied to HUD layout.
  - `src/ui/controls` for reusable UI primitives and composites (buttons, sliders, field groups).
- Colocate tests next to components (`*.test.tsx`).
- Use `index.ts` barrels per area to keep imports shallow; do not introduce path aliases.
- Non-React utilities (e.g., canvas rendering) live under `src/domain/render/`, not `src/ui`.
- UI uses Tailwind; aim for a "control panel" HUD look, not webby.
- Unit tests should live right next to the file they cover, and should be named the same as the file but suffixed with `.test.ts(x)` instead of `.ts(x)`. For example: unit tests for `src/foo/Bar.ts` should live in `src/foo/Bar.test.ts`, NOT in some separate `src/foo/tests` directory.

#### Pause & Menus

- Opening any overlay menu/dialog pauses the game (e.g., Settings, Perks). This applies to any future menus as well.
- Centralize pause/resume logic in the app shell (`src/ui/shell/CanvasRoot.tsx`) using a derived paused flag; individual components should not directly control the loop.
- Effective paused state is the OR of the explicit pause menu (Esc) and visibility of menu overlays (settings/perks). Closing all menus resumes automatically.

### Sprites & Rendering Assets

- Sprite SVGs must be tightly bounded to the artwork; do not include empty padding to account for nearby objects (e.g., ship hull). Positioning/alignment belongs in code, not in the asset.
- When a sprite has an obvious "near edge" (attachment side), design the SVG so that the near edge is at the viewBox boundary. Rendering code should align to that edge as needed.
- Keep variants consistent in coordinate space so render math remains variant-agnostic.

#### HUD/Menu Visual Consistency

- Use one shared visual style for all HUD panels and UI menus.
  - The canonical style is the top-right HUD panel look.
  - Implement via the shared `hud-panel` utility class (see `src/index.css`) which sets the font (`font-hud`), background, border, rounding, and shadow.
  - All HUD panels and overlay menus/dialogs must wrap content in a `div.hud-panel` and only add spacing/positioning (e.g., `p-4`, `w-[...]`, `left-*`, `top-*`) as needed.
  - Headings and labels should use `hud-text` for accent coloring and tracking.
