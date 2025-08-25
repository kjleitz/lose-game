export type Action =
  | "thrust"
  | "turnLeft"
  | "turnRight"
  | "fire"
  | "interact"
  | "boost"
  | "speedUp"
  | "speedDown"
  | "land"
  | "takeoff";

export type ActionState = Set<Action>;

export interface ActionEvent {
  action: Action;
  pressed: boolean;
}

export type ActionQueue = ActionEvent[];