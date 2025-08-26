import { defineSystem } from "../../../lib/ecs/dist";
import type { World } from "../../../lib/ecs/dist";
import {
  Position,
  Velocity,
  Rotation,
  AIVision,
  AIMovement,
  AIState,
  Enemy,
  Player,
} from "../components";

export function createEnemyAISystem(world: World, dt: number) {
  return defineSystem(world)
    .withComponents({
      position: Position,
      velocity: Velocity,
      rotation: Rotation,
      aiVision: AIVision,
      aiMovement: AIMovement,
      aiState: AIState,
      enemy: Enemy,
    })
    .execute((entities) => {
      // Get player position
      const playerEntities = world.query({ position: Position, player: Player });
      if (playerEntities.length === 0) return;

      const playerPos = playerEntities[0].components.position;

      entities.forEach(({ components }) => {
        const { position, velocity, rotation, aiVision, aiMovement, aiState } = components;

        // Calculate distance to player
        const dx = playerPos.x - position.x;
        const dy = playerPos.y - position.y;
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared);

        // Update AI state based on distance with hysteresis
        const wasTargeting = aiVision.hasTarget;
        const visionRadiusAdjusted = wasTargeting
          ? aiVision.radius + aiVision.hysteresis
          : aiVision.radius - aiVision.hysteresis;

        aiVision.hasTarget = distance <= visionRadiusAdjusted;

        if (aiVision.hasTarget) {
          aiState.currentState = "pursuing";

          // Move toward player
          if (distance > 0) {
            const targetAngle = Math.atan2(dy, dx);

            // Turn toward target
            let angleDiff = targetAngle - rotation.angle;
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            const turnAmount =
              Math.sign(angleDiff) * Math.min(Math.abs(angleDiff), aiMovement.turnSpeed * dt);
            rotation.angle += turnAmount;

            // Apply thrust
            const thrustX = Math.cos(rotation.angle) * aiMovement.accel * dt;
            const thrustY = Math.sin(rotation.angle) * aiMovement.accel * dt;

            velocity.dx += thrustX;
            velocity.dy += thrustY;

            // Limit speed
            const speed = Math.sqrt(velocity.dx * velocity.dx + velocity.dy * velocity.dy);
            if (speed > aiMovement.maxSpeed) {
              velocity.dx = (velocity.dx / speed) * aiMovement.maxSpeed;
              velocity.dy = (velocity.dy / speed) * aiMovement.maxSpeed;
            }
          }
        } else {
          aiState.currentState = "idle";
          // Apply drag when not pursuing
          velocity.dx *= 0.95;
          velocity.dy *= 0.95;
        }

        aiState.stateTime += dt;
      });
    });
}
