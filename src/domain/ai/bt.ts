export type Status = "Success" | "Failure" | "Running";

export interface Blackboard {
  // Arbitrary state bag used by behaviors
  [key: string]: unknown;
  // Shared scratch space for nodes (per-entity)
  scratch: Record<string, unknown>;
}

export interface Node {
  id: string;
  tick(bb: Blackboard, dt: number): Status;
}

let nextId = 0;
function uid(prefix: string) {
  return `${prefix}-${++nextId}`;
}

export function Condition(name: string, fn: (bb: Blackboard) => boolean): Node {
  const id = uid(`cond:${name}`);
  return {
    id,
    tick(bb) {
      return fn(bb) ? "Success" : "Failure";
    },
  };
}

export function Action(name: string, fn: (bb: Blackboard, dt: number) => Status): Node {
  const id = uid(`act:${name}`);
  return {
    id,
    tick(bb, dt) {
      return fn(bb, dt);
    },
  };
}

export function Sequence(name: string, children: Node[]): Node {
  const id = uid(`seq:${name}`);
  return {
    id,
    tick(bb, dt) {
      for (const child of children) {
        const s = child.tick(bb, dt);
        if (s !== "Success") return s;
      }
      return "Success";
    },
  };
}

export function Selector(name: string, children: Node[]): Node {
  const id = uid(`sel:${name}`);
  return {
    id,
    tick(bb, dt) {
      for (const child of children) {
        const s = child.tick(bb, dt);
        if (s !== "Failure") return s;
      }
      return "Failure";
    },
  };
}

// Decorators
export function Inverter(name: string, child: Node): Node {
  const id = uid(`inv:${name}`);
  return {
    id,
    tick(bb, dt) {
      const s = child.tick(bb, dt);
      if (s === "Success") return "Failure";
      if (s === "Failure") return "Success";
      return s;
    },
  };
}
