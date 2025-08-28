export interface VisualConfig {
  cloudDensity: number; // multiplier, 0..2
  birdDensity: number; // multiplier, 0..2
  foamDensity: number; // multiplier, 0..2
}

let visualConfig: VisualConfig = {
  cloudDensity: 1,
  birdDensity: 1,
  foamDensity: 1,
};

export function getVisualConfig(): VisualConfig {
  return visualConfig;
}

export function setVisualConfig(patch: Partial<VisualConfig>): void {
  visualConfig = { ...visualConfig, ...patch };
}
