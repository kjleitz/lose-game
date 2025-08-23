# ADR-0002: Tooling, Style, and CI

## Status

Accepted

## Context

We need consistent development ergonomics, formatting, and automated checks for PRs.

## Decision

- Package manager: npm; Node 24
- Build: Vite (React + TS template)
- Lint/format: ESLint + Prettier; Husky + lint-staged pre-commit
- Tests: Vitest + React Testing Library; JSDOM environment
- Styles: Tailwind with HUD-oriented tokens
- CI: GitHub Actions runs build, typecheck, lint, test on PRs

## Consequences

- Faster local dev + consistent style and imports
- CI protects main via standard checks
- Minimal friction to add e2e (Playwright) later
