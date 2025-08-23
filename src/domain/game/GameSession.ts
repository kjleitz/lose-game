import { setCameraPosition } from "../render/camera";
import type { Player } from "./player";
import type { Planet } from "./planets";

export class GameSession {
  camera: { x: number; y: number; zoom: number };
  player: Player;
  planets: Planet[];
  size: { width: number; height: number };
  notification: string | null = null;

  constructor({
    camera,
    player,
    planets,
    size,
  }: {
    camera: { x: number; y: number; zoom: number };
    player: Player;
    planets: Planet[];
    size: { width: number; height: number };
  }) {
    this.camera = camera;
    this.player = player;
    this.planets = planets;
    this.size = size;
  }

  update(
    actions: Set<string>,
    updatePlayer: (dt: number, actions: Set<string>) => void,
    maybeGenerateRegion: (center: { x: number; y: number }, regionKey: string) => void,
    dt: number,
  ) {
    updatePlayer(dt, actions);
    setCameraPosition(this.camera, this.player.state.x, this.player.state.y);
    // Procedural planet generation by region
    const REGION_SIZE = Math.max(this.size.width, this.size.height) * 4;
    const regionX = Math.floor(this.player.state.x / REGION_SIZE);
    const regionY = Math.floor(this.player.state.y / REGION_SIZE);
    const regionKey = `${regionX},${regionY}`;
    maybeGenerateRegion({ x: regionX * REGION_SIZE, y: regionY * REGION_SIZE }, regionKey);
    // Check proximity to planets
    let foundPlanet: Planet | null = null;
    for (const planet of this.planets) {
      const dist = Math.hypot(this.player.state.x - planet.x, this.player.state.y - planet.y);
      if (dist < planet.radius + 60) {
        foundPlanet = planet;
        break;
      }
    }
    if (foundPlanet) {
      this.notification = `Arrived at planet! (${foundPlanet.id})`;
    } else {
      this.notification = null;
    }
  }
}
