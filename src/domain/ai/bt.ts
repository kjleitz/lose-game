export type Status = "Success" | "Failure" | "Running";

// Behavior tree primitives are generic over the blackboard type (BB),
// so trees can be strongly typed per domain without casts or index signatures.
export interface Node<BB> {
  id: string;
  tick(bb: BB, dt: number): Status;
}

let nextId = 0;
function uid(prefix: string): string {
  return `${prefix}-${++nextId}`;
}

export function Condition<BB>(name: string, fn: (bb: BB) => boolean): Node<BB> {
  const id = uid(`cond:${name}`);
  return {
    id,
    tick(bb: BB, _dt: number): Status {
      return fn(bb) ? "Success" : "Failure";
    },
  };
}

export function Action<BB>(name: string, fn: (bb: BB, dt: number) => Status): Node<BB> {
  const id = uid(`act:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      return fn(bb, dt);
    },
  };
}

export function Sequence<BB>(name: string, children: Node<BB>[]): Node<BB> {
  const id = uid(`seq:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      for (const child of children) {
        const s = child.tick(bb, dt);
        if (s !== "Success") return s;
      }
      return "Success";
    },
  };
}

export function Selector<BB>(name: string, children: Node<BB>[]): Node<BB> {
  const id = uid(`sel:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      for (const child of children) {
        const s = child.tick(bb, dt);
        if (s !== "Failure") return s;
      }
      return "Failure";
    },
  };
}

// Decorators
export function Inverter<BB>(name: string, child: Node<BB>): Node<BB> {
  const id = uid(`inv:${name}`);
  return {
    id,
    tick(bb: BB, dt: number): Status {
      const s = child.tick(bb, dt);
      if (s === "Success") return "Failure";
      if (s === "Failure") return "Success";
      return s;
    },
  };
}
