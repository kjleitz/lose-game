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
