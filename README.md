# L.O.S.E.: Lots of Outer Space to Explore

Remake of a game I started building a while back that never went anywhere. Much more to this one.

## Getting Started

- Install: `npm install`
- Development server: `npm run dev`
- Preview production server: `npm run preview`
- Tests: `npm run test`
- Coverage: `npm run coverage`
- Lint: `npm run lint`
- Format: `npm run format`
- Typecheck: `npm run typecheck`
- Build/preview: `npm run build`/`npm run preview`
- Run all required checks (typecheck, lint, tests): `npm run checks`

## Docs

- Core MUST-FOLLOW rules for the project: `RULES.md`
- Decisions (ADRs): `docs/adr/`
  - add a new ADR if making a significant design change

## Quality Gates

- Typecheck: `npm run typecheck`
- Lint: `npm run lint`
- Tests (unit): `npm run test`
- Tests (E2E): `npm run e2e`
  - **NOTE:** e2e tests are on hold
- Typecheck && lint && test: `npm run checks`

## Conventions

- See `RULES.md`

## Style

- See `eslint.config.js` and `RULES.md`

## Formatting

- Prettier; see `.prettierrc.json`
