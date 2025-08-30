Behavior Trees (Generic)

Lightweight, strongly typed behavior tree primitives for AI decision-making. These building blocks are generic over your own blackboard type, so you can write domain-specific behavior trees without casts or unsafe indexing.

Features

- Minimal API: `Action`, `Condition`, `Sequence`, `Selector`, `Inverter`.
- Useful extras: `Succeeder`, `Failer`, `Repeat`, `RepeatUntilSuccess`, `RepeatUntilFailure`, `Parallel` (with thresholds).
- Strong typing via a generic blackboard type parameter.
- Deterministic short-circuiting behavior for `Sequence` and `Selector`.
- No runtime dependencies; pure TypeScript.
- Memory and timing helpers for common patterns.

Installation

- This package is internal to the repo. Import it via relative path: `import { Sequence, Action } from "../../lib/behavior-tree";` from within `src/` files.

Core Concepts

- Status: Nodes return one of `"Success" | "Failure" | "Running"` on `tick`.
- Blackboard (BB): Your domain state passed into `tick(bb, dt)`.
- Nodes: Functions to create nodes, each with a stable `id` and `tick` function.

API

- `type Status = "Success" | "Failure" | "Running"`
- `interface Node<BB> { id: string; tick(bb: BB, dt: number): Status }`
- `Condition<BB>(name: string, fn: (bb: BB) => boolean): Node<BB>`
  - Returns `Success` when `fn(bb)` is truthy, else `Failure`.
- `Action<BB>(name: string, fn: (bb: BB, dt: number) => Status): Node<BB>`
  - Executes `fn` and returns its status.
- `Sequence<BB>(name: string, children: Node<BB>[]): Node<BB>`
  - Evaluates children left-to-right; returns first non-`Success` status, or `Success` if all succeed.
- `Selector<BB>(name: string, children: Node<BB>[]): Node<BB>`
  - Evaluates children left-to-right; returns first non-`Failure` status, or `Failure` if all fail.
- `Inverter<BB>(name: string, child: Node<BB>): Node<BB>`
  - Flips `Success`⇄`Failure`; passes through `Running`.

- `Succeeder<BB>(name: string, child: Node<BB>): Node<BB>`
  - Converts `Failure`→`Success`; passes through `Running`.

- `Failer<BB>(name: string, child: Node<BB>): Node<BB>`
  - Converts `Success`→`Failure`; passes through `Running`.

- `Repeat<BB>(name: string, child: Node<BB>, times: number): Node<BB>`
  - Counts child completions (either `Success` or `Failure`) until `times`, returns `Running` until then, then `Success`.

- `RepeatUntilSuccess<BB>(name: string, child: Node<BB>, maxAttempts?: number): Node<BB>`
  - Returns `Success` once child succeeds. If child keeps failing and `maxAttempts` is reached, returns `Failure`.

- `RepeatUntilFailure<BB>(name: string, child: Node<BB>, maxAttempts?: number): Node<BB>`
  - Returns `Failure` once child fails. If child keeps succeeding and `maxAttempts` is reached, returns `Success`.

- `Parallel<BB>(name: string, children: Node<BB>[], opts?): Node<BB>`
  - Ticks all children and aggregates results.
  - Options: `{ successThreshold?: number; failureThreshold?: number }`.
  - Defaults: success when all succeed; fail when any fail; otherwise running.

Example

```ts
import {
  Action,
  Condition,
  Sequence,
  Selector,
  RepeatUntilSuccess,
  Parallel,
  MemSequence,
  Wait,
} from "./index";

interface BB {
  energy: number;
  targetSeen: boolean;
}

const recover = Action<BB>("recover", (bb) => {
  if (bb.energy < 10) {
    bb.energy += 1;
    return "Running";
  }
  return "Success";
});

const chase = Action<BB>("chase", () => "Success");
const tryChase = RepeatUntilSuccess<BB>("tryChase", chase, 3);

const seek = MemSequence<BB>("seek", [Condition<BB>("hasTarget", (bb) => bb.targetSeen), tryChase]);

const tree = Selector<BB>("root", [
  seek,
  Parallel<BB>("fallback", [Wait<BB>("restDelay", recover, 0.5)]),
]);

tree.tick({ energy: 0, targetSeen: false }, 0.016);
```

Testing

- Unit tests live next to each implementation file as `*.test.ts`.
- Run with `npm run test` or `npm run coverage`.

Folder Structure

- `src/lib/behavior-tree/src/types.ts` – shared types
- `src/lib/behavior-tree/src/internal/uid.ts` – internal ID helper
- `src/lib/behavior-tree/src/nodes/*` – leaf nodes (with `*.test.ts`)
- `src/lib/behavior-tree/src/decorators/*` – decorators (with `*.test.ts`)
- `src/lib/behavior-tree/src/composites/*` – composites (with `*.test.ts`)
