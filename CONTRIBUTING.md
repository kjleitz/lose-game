# Contributing to L.O.S.E.

Thanks for your interest in contributing! This guide explains how to set up the project, coding conventions, testing, and PR standards.

Setup

- Node: LTS (`lts/*`).
- Install: `npm ci`
- Develop: `npm run dev` (Vite dev server)
- Build: `npm run build`

Quality Gates

- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Tests (unit): `npm run test`
- Tests (E2E): `npx playwright test`

Conventions

- Language/Stack: Vite + React + TypeScript; Tailwind for HUD.
- Style: ESLint + Prettier; TypeScript strict; 2-space indent; semicolons.
- Filenames: `kebab-case.ts[x]`; components use `PascalCase`; hooks `useX`.
- Imports: relative ES module imports (no path aliases).
- Commits: Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`).

Testing Strategy

- Unit/Component: Vitest (JSDOM), collocated `*.test.ts[x]` or `tests/`.
- E2E: Playwright (`e2e/**`), runs against Vite preview server.
- See docs/testing.md for details and selectors.

PR Guidelines

- Describe the change, link issues (`Closes #123`).
- Include screenshots for UI changes (HUD panels, overlays).
- Note risks/rollbacks; ensure CI is green (typecheck/lint/unit/e2e as applicable).

Architecture & Decisions

- Start with docs/overview.md and docs/architecture.md.
- ADRs live in docs/decisions/; add a new ADR if making a significant design change.

Security

- Do not commit secrets. If env vars are needed, add `.env.example`.
