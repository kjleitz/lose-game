import { describe, it, expect } from "vitest";
import { Action } from "./Action";

interface BB {
  v?: number;
}

describe("Action", () => {
  it("returns underlying function status and receives dt", () => {
    let dtSeen = 0;
    const act = Action<BB>("tick", (_bb, dt) => {
      dtSeen = dt;
      return "Running";
    });
    const s = act.tick({}, 0.016);
    expect(s).toBe("Running");
    expect(dtSeen).toBeCloseTo(0.016, 1e-6);
  });

  it("can mutate blackboard and succeed", () => {
    const act = Action<BB>("mutate", (bb) => {
      bb.v = (bb.v ?? 0) + 1;
      return "Success";
    });
    const b: BB = { v: 1 };
    const s = act.tick(b, 0);
    expect(s).toBe("Success");
    expect(b.v).toBe(2);
  });
});
