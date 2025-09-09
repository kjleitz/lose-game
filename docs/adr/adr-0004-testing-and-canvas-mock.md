# ADR-0004: Testing Strategy and Canvas Mock

## Status

Accepted

## Context

We test React components and engine modules in JSDOM. Canvas APIs are not implemented in JSDOM by default.

## Decision

- Use Vitest + React Testing Library for components; plain Vitest for engine modules.
- Provide a minimal `HTMLCanvasElement.getContext` mock in `src/setupTests.ts` for tests.
- Co-locate small unit tests near code; use `tests/` for broader integration as they grow.
- Track coverage with `vitest --coverage`; target ≥80% on changed code.

## Consequences

- Deterministic tests without requiring the `canvas` native package
- Easy to expand to integration tests (loop + renderer + input)
