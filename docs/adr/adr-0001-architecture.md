# ADR-0001: Modular Systems over ECS (initially)

## Status

Accepted

## Context

We need an understandable, fast-to-iterate architecture. ECS offers scale and cache-friendly updates but adds concepts and boilerplate. The project aims for clarity and momentum early.

## Decision

Use a modular systems approach (renderer, physics, collision, input) orchestrated by a single fixed-timestep loop. Keep modules pure where feasible. No path aliases; use native ESM relative imports.

## Consequences

- Pros: simpler mental model, easier onboarding, fewer abstractions.
- Cons: may require refactoring if entity counts explode; ECS migration remains possible as modules are already decoupled.
