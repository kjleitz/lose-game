export type AmmoType = "standard" | "kinetic" | "plasma" | "ion";

export interface AmmoInfo {
  id: AmmoType;
  label: string;
}

export const AMMO_TYPES: ReadonlyArray<AmmoInfo> = [
  { id: "standard", label: "Standard" },
  { id: "kinetic", label: "Kinetic" },
  { id: "plasma", label: "Plasma" },
  { id: "ion", label: "Ion" },
];

export function ammoLabel(type: AmmoType): string {
  const found = AMMO_TYPES.find((ammo) => ammo.id === type);
  return found ? found.label : type;
}

export interface AmmoProfile {
  speed: number; // units/s projectile speed
  damage: number; // hit damage
  cooldown: number; // seconds between shots
  spread: number; // base spread (radians), 0 for perfectly accurate
}

export function getAmmoProfile(type: AmmoType): AmmoProfile {
  switch (type) {
    case "kinetic":
      return { speed: 760, damage: 20, cooldown: 0.12, spread: 0.06 };
    case "plasma":
      // Slow, heavy plasma bolts
      return { speed: 520, damage: 32, cooldown: 0.75, spread: 0 };
    case "ion":
      // Very rapid, low-damage ion shots
      return { speed: 650, damage: 5, cooldown: 0.05, spread: 0.12 };
    default:
      return { speed: 600, damage: 25, cooldown: 0.2, spread: 0.12 };
  }
}
