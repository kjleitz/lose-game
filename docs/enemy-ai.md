# Enemy AI: Patrol + Seek via Behavior Trees

This document describes the design and module layout for enemy AI using a lightweight behavior tree (BT). Code will be implemented in a subsequent change.

Goals

- Make enemy behavior modular, readable, and testable.
- Support two initial behaviors: Patrol (wander/waypoints), Seek (chase player in detection radius).
- Keep the core pure; side-effects centralized and explicit.

BT Overview

- Node interface: `tick(bb, dt): Status` where `Status ∈ {Success, Failure, Running}`.
- Core nodes:
  - Sequence: runs children in order; stops on first Failure or Running; Success only if all succeed.
  - Selector: runs children in order; stops on first Success or Running; Failure only if all fail.
  - Condition: pure predicate over blackboard.
  - Action: performs side‑effect or writes intents; returns status.
  - Decorators: optional (e.g., Inverter, Succeeder, RepeatUntil).
- Blackboard (bb): `{ enemy, player, planets, rng, time, config, scratch }`.
  - `scratch` is per‑node ephemeral state keyed by node id.

Behavior Composition

- Root: Selector(
  - Sequence(IsAlive, SeekSubtree),
  - Sequence(IsAlive, PatrolSubtree),
  - DoNothing
    )

- SeekSubtree (Sequence):
  1. `PlayerDetected` (distance ≤ visionRadius; hysteresis: exit only when distance > visionRadius + margin)
  2. `FaceTarget(player)` (turn towards player at `turnSpeed`)
  3. `ThrustForward` (accelerate up to `maxSpeed`)
  4. optional `TryFire` (in cone and cooldown OK)

- PatrolSubtree (Sequence):
  1. `EnsureWaypoint` (generate ring/circle waypoint near spawn if missing; or pick next)
  2. `FaceTarget(waypoint)`
  3. `ThrustForward`
  4. `ArrivedAtWaypoint?` (within tolerance → Success; else Running)

Actions produce intents, not direct physics:

- For consistency with the player, we can either:
  - a) Apply forces directly to enemy state (simpler to start), or
  - b) Emit intent flags `{ turnLeft|turnRight|thrust|fire }` that the GameSession translates into motion. (Future‑friendly if we add common movement handling.)

Initial implementation uses (a) for simplicity; the BT Action nodes will update enemy `angle`, `vx`, `vy`, with shared constants for `TURN_SPEED`, `ACCEL`, `DRAG`, and clamps.

Data Model Changes

- Extend `Enemy` with motion fields and config:
  - `angle: number`, `vx: number`, `vy: number`
  - `visionRadius: number` (e.g., 700), `visionHysteresis: number` (e.g., +80)
  - Movement: `turnSpeed`, `accel`, `maxSpeed`
  - Optional `fireCooldown`, `fireRate` for later firing

Module Structure

- `src/domain/ai/bt.ts`
  - Types: `Status`, `Node`, `Blackboard`.
  - Nodes: `Sequence`, `Selector`, `Condition`, `Action`, minimal decorators.
  - Pure; no engine globals.

- `src/domain/ai/enemy/behaviors.ts`
  - Conditions: `playerDetected`, `arrivedAtWaypoint`, `isAlive`.
  - Actions: `ensureWaypoint`, `faceTarget`, `thrustForward`, `tryFire` (stub for later).
  - Helpers: `angleTo`, `turnTowards`, `clamp`, `wrapAngle`.

- `src/domain/ai/enemy/trees.ts`
  - `buildPatrolSeekTree(config?)` → returns root `Node` with ids for scratch state.
  - Per‑enemy instance: reuse one tree structure; store instance state in blackboard.scratch.

- Integration: `GameSession`
  - Create/hold an AI controller (map enemyId → tree/blackboard or share tree + per enemy scratch).
  - On update: tick each enemy tree with `{ enemy, player, planets, time, config }`, dt.
  - Apply updated enemy state; enforce drag/clamps.
  - (Later) `tryFire` can enqueue enemy projectiles similar to player.

Testing Strategy

- BT Core Tests (`bt.ts`):
  - Sequence/Selector short‑circuit and status propagation.
  - Condition and Action lifecycle; Running behavior.

- Behavior Tests (`behaviors.ts` + `trees.ts`):
  - `playerDetected`: inside/outside radius with hysteresis.
  - `faceTarget`: angle monotonic movement toward target; bounded by `turnSpeed * dt`.
  - `thrustForward`: speed increases up to `maxSpeed`; respects `DRAG` when not thrusting.
  - Patrol: waypoint creation and advancement when arriving within tolerance.
  - Seek: when player moves inside detection radius, tree selects seek path; when player exits with hysteresis, returns to patrol.

Performance & Determinism

- Reuse tree instances (or a shared static tree) to avoid per‑frame allocation; per‑enemy state goes into `blackboard.scratch` keyed by node id.
- Keep nodes pure except action side‑effects on `enemy` (angle/velocity).
- O(N) per frame with small constants.

Phased Plan

1. Implement BT core and unit tests.
2. Implement patrol/seek behaviors and trees; extend `Enemy` with motion fields and constants; add tests.
3. Integrate AI tick into `GameSession` update; validate movement visually and via tests.
4. (Optional) Add `tryFire` gate and enemy projectiles.

References

- ADR-0006 (this decision): docs/decisions/adr-0006-enemy-ai-behavior-tree.md
