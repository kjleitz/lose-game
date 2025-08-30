import { describe, it, expect } from "vitest";
import { Parallel } from "./Parallel";
import { Action } from "../nodes/Action";

interface BB {}

describe("Parallel", () => {
  it("defaults: all success => Success; any failure => Failure; else Running", () => {
    const s = Action<BB>("s", () => "Success");
    const f = Action<BB>("f", () => "Failure");
    const r = Action<BB>("r", () => "Running");
    expect(Parallel<BB>("p1", [s, s]).tick({}, 0)).toBe("Success");
    expect(Parallel<BB>("p2", [s, f]).tick({}, 0)).toBe("Failure");
    expect(Parallel<BB>("p3", [s, r]).tick({}, 0)).toBe("Running");
  });

  it("thresholds: succeed at N successes; fail at M failures", () => {
    const s = Action<BB>("s", () => "Success");
    const f = Action<BB>("f", () => "Failure");
    const r = Action<BB>("r", () => "Running");
    const p = Parallel<BB>("p", [s, r, f, s], { successThreshold: 2, failureThreshold: 2 });
    expect(p.tick({}, 0)).toBe("Success");
    const p2 = Parallel<BB>("p2", [r, f, f, r], { successThreshold: 3, failureThreshold: 2 });
    expect(p2.tick({}, 0)).toBe("Failure");
  });
});
