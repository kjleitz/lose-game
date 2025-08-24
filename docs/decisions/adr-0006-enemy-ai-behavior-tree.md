# ADR-0006: Enemy AI via Behavior Trees (BT)

## Status

Accepted (2025-08-23)

## Context

We need enemy AI that is easy to reason about, extend, and test. Current enemies are static targets. Planned behaviors include patrol (wandering/waypoints) and seek/chase the player when detected. Future behaviors might include flee, guard, flocking, or group tactics.

## Decision

Use a lightweight Behavior Tree (BT) implementation for enemy AI:

- Provide a minimal, composable BT core (Sequence, Selector, Condition, Action, optional Decorators) with statuses: Success | Failure | Running.
- Tick enemies each frame with `dt`, using a shared Blackboard (enemy, player, world state).
- Compose patrol/seek logic from small condition/action nodes.
- Keep the BT engine framework-agnostic and pure; limit side-effects to explicit action nodes.

## Consequences

- Pros: Clear, modular behaviors; easy to add new nodes; deterministic unit testing; readable trees.
- Cons: Slight overhead vs hand-coded FSM; requires discipline to avoid complex side-effects inside nodes.
- Mitigation: Small node set; reuse trees per enemy; store per-node state in blackboard.

## Alternatives Considered

- Finite State Machine: simpler but becomes tangled as behaviors grow; harder to reuse.
- Utility AI: flexible scoring but overkill for current scope.
- Scripting per enemy: fast initially, poor reuse and testability.

## Scope

Initial BT supports: patrol (waypoints/wander), seek (chase player in radius with hysteresis), and optional fire gate (cone + cooldown) later.
