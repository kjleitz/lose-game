import type { Action } from "../../../application/input/ActionTypes";
import type { Enemy } from "../enemies";
import type { Planet } from "../planets";
import type { Projectile } from "../projectiles";
import { createProjectile, stepProjectile } from "../projectiles";
import type { Player } from "../player";
import { GameMode, type GameModeState, type GameModeType, type SpaceModeState } from "./GameMode";

export class SpaceMode extends GameMode {
  readonly type = "space" as const;

  private planets: Planet[];
  private enemies: Enemy[];
  private projectiles: Projectile[] = [];
  private visitedPlanets: Set<string> = new Set();
  // viewport size is currently unused by this mode

  constructor(
    planets: Planet[],
    enemies: Enemy[] | undefined,
    _size: { width: number; height: number },
    _player: Player,
  ) {
    super();
    this.planets = planets;
    this.enemies = enemies ?? [];
    // _size reserved for future use
  }

  update(
    dt: number,
    actions: Set<Action>,
    player: Player,
    session: { requestModeTransition: (m: GameModeType, d?: { planetId?: string }) => void },
  ): void {
    // Space flight controls delegated to player
    player.updateSpace(dt, actions);

    // Fire projectile
    if (actions.has("fire")) {
      this.projectiles.push(createProjectile(player.state));
    }

    // Step projectiles and cull expired
    for (const projectile of this.projectiles) stepProjectile(projectile, dt);
    this.projectiles = this.projectiles.filter((projectile) => projectile.ttl > 0);

    // Landing request: choose nearest planet within a simple radius threshold
    if (actions.has("land")) {
      const nearestPlanet = this.findNearestPlanet(player.state.x, player.state.y);
      if (
        nearestPlanet &&
        this.distance(player.state.x, player.state.y, nearestPlanet.x, nearestPlanet.y) <=
          nearestPlanet.radius + 30
      ) {
        this.visitedPlanets.add(nearestPlanet.id);
        session.requestModeTransition("planet", { planetId: nearestPlanet.id });
      }
    }
  }

  canTransitionTo(mode: GameModeType): boolean {
    return mode === "planet";
  }

  saveState(): SpaceModeState {
    return {
      type: "space",
      playerPosition: { x: 0, y: 0 }, // GameSession provides canonical player pos
      visitedPlanets: new Set(this.visitedPlanets),
    };
  }

  private isSpaceState(state: GameModeState): state is SpaceModeState {
    return state.type === "space";
  }

  loadState(state: GameModeState): void {
    if (!this.isSpaceState(state)) return;
    this.visitedPlanets = new Set(state.visitedPlanets);
  }

  getRequiredHudComponents(): string[] {
    return ["Radar", "ActionReadout"]; // minimal HUD in space
  }

  // Data accessors for rendering and UI
  getPlanetsData(): Planet[] {
    return this.planets;
  }

  updatePlanets(newPlanets: Planet[]): void {
    this.planets = newPlanets;
  }

  getProjectilesData(): Projectile[] {
    return this.projectiles;
  }

  getEnemiesData(): Enemy[] {
    return this.enemies;
  }

  private findNearestPlanet(x: number, y: number): Planet | undefined {
    let best: Planet | undefined;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const planet of this.planets) {
      const distanceToPlanet = this.distance(x, y, planet.x, planet.y);
      if (distanceToPlanet < bestDist) {
        best = planet;
        bestDist = distanceToPlanet;
      }
    }
    return best;
  }

  private distance(ax: number, ay: number, bx: number, by: number): number {
    return Math.hypot(ax - bx, ay - by);
  }
}
