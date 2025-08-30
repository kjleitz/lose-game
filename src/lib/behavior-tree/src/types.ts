export type Status = "Success" | "Failure" | "Running";

export interface Node<BB> {
  id: string;
  tick(bb: BB, dt: number): Status;
}
