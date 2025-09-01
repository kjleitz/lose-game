import type { Enemy } from "../domain/game/enemies";
import type { PlayerInventory } from "../domain/game/inventory/PlayerInventory";
import type { Planet } from "../domain/game/planets";
import type { Camera } from "../domain/render/camera";
import type { Circle2D, Kinematics2D, ViewSize } from "../shared/types/geometry";
import type { Action } from "./input/ActionTypes";
import type { PerkId } from "../domain/leveling/types";

export interface GameOptions {
  size: ViewSize;
  camera?: Camera;
  initialWorld?: {
    player?: { state: Kinematics2D & { health: number } };
    planets?: Array<Planet>;
    enemies?: Array<Pick<Enemy, "id" | "x" | "y" | "angle" | "health" | "radius">>;
  };
  render?: { pixelRatio?: number };
  input?: { target?: Window | HTMLElement };
}

export interface GameSnapshot {
  player: Kinematics2D & {
    health: number;
    experience: number;
    level: number;
    xpToNextLevel: number;
    perkPoints: number;
    perks: Record<string, number>;
  };
  camera: Camera;
  planets: Array<Planet>;
  enemies: Array<Pick<Enemy, "id" | "x" | "y" | "angle" | "health" | "radius">>;
  projectiles: Array<Circle2D>;
  stats: {
    fps: number;
    entityCount: { players: number; enemies: number; planets: number; projectiles: number };
  };
}

export type GameEvent =
  | { type: "tick"; snapshot: GameSnapshot }
  | { type: "notification"; message: string }
  | { type: "inputChanged"; actions: Action[] }
  | { type: "speedChanged"; value: number }
  | { type: "modeChange"; mode: "space" | "planet" }
  | { type: "healthChanged"; value: number }
  | { type: "xpChanged"; value: number }
  | { type: "inventoryUpdated" } // simplified for now
  | { type: "setSpeed"; value: number }
  | { type: "pauseToggle" }
  | { type: "land" }
  | { type: "takeoff" }
  | { type: "useItem"; itemId: string }
  | { type: "dropItem"; itemId: string; quantity: number }
  | { type: "rebind"; action: Action; code: string };

export type Unsubscribe = () => void;

export interface GameBus {
  subscribe<T extends GameEvent["type"]>(
    type: T,
    handler: (e: Extract<GameEvent, { type: T }>) => void,
  ): Unsubscribe;
  publish(e: GameEvent): void;
  onAny(handler: (e: GameEvent) => void): Unsubscribe;
}

export interface GameController {
  start(): void;
  stop(): void;
  pause(): void;
  resume(): void;
  dispose(): void;
  setSpeed(multiplier: number): void;
  getSpeed(): number;
  setZoom(zoom: number): void;
  getSnapshot(): GameSnapshot;
  bus: GameBus;
  dispatch(action: Action): void;
  rebind(action: Action, code: string): void;
  // Optional extras exposed by some controllers
  getInventory?: () => PlayerInventory;
  unlockPerk?: (perkId: PerkId) => void;
}
