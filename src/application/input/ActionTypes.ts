export type Action =
  | "thrust"
  | "turnLeft"
  | "turnRight"
  | "fire"
  | "interact"
  | "moveDown"
  | "boost"
  | "speedUp"
  | "speedDown"
  | "land"
  | "takeoff"
  | "inventory"
  | "board";

export type ActionState = Set<Action>;

export interface ActionEvent {
  action: Action;
  pressed: boolean;
}

export type ActionQueue = ActionEvent[];
