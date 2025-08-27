export interface Point2D {
  x: number;
  y: number;
}

// Finite difference delta (used by ECS Velocity component)
export interface Delta2D {
  dx: number;
  dy: number;
}

// Velocity components expressed explicitly (used by gameplay state/UI)
export interface Velocity2D {
  vx: number;
  vy: number;
}

export interface Rotation2D {
  angle: number;
}

export interface ViewSize {
  width: number;
  height: number;
}

export interface Circle2D extends Point2D {
  radius: number;
}

// Common kinematic bundle used by rendering for player-like actors
export interface Kinematics2D extends Point2D, Velocity2D, Rotation2D {}

// Pose with orientation, without velocity
export interface Pose2D extends Point2D, Rotation2D {}
