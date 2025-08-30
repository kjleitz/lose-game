import { Action, Condition, Sequence, Selector, Inverter, type Node } from "../src/index";

interface Blackboard {
  energy: number;
  targetSeen: boolean;
}

const rest = Action<Blackboard>("rest", (bb) => {
  if (bb.energy < 10) {
    bb.energy += 1;
    return "Running";
  }
  return "Success";
});

const hasTarget = Condition<Blackboard>("hasTarget", (bb) => bb.targetSeen);
const noTarget = Inverter<Blackboard>("noTarget", hasTarget);

const chase = Action<Blackboard>("chase", () => "Success");

export const tree: Node<Blackboard> = Selector<Blackboard>("root", [
  Sequence<Blackboard>("seek", [hasTarget, chase]),
  Sequence<Blackboard>("recover", [noTarget, rest]),
]);
