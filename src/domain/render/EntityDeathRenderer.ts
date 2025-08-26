export interface DeadEntity {
  id: string;
  x: number;
  y: number;
  ageSeconds: number;
  entityType: string;
  size: number;
}

import { TIME } from "../../config/time";

export class EntityDeathRenderer {
  private deadEntities: Map<string, DeadEntity> = new Map();
  private readonly CORPSE_DURATION_SEC = TIME.CORPSE_DURATION_SEC;

  addDeadEntity(
    id: string,
    x: number,
    y: number,
    entityType: string = "unknown",
    size: number = 20,
  ): void {
    this.deadEntities.set(id, {
      id,
      x,
      y,
      ageSeconds: 0,
      entityType,
      size,
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const deadEntity of this.deadEntities.values()) {
      this.renderDeadEntity(ctx, deadEntity);
    }
  }

  update(dt: number): void {
    const entitiesToRemove: string[] = [];

    for (const [id, deadEntity] of this.deadEntities) {
      deadEntity.ageSeconds += dt;
      if (deadEntity.ageSeconds > this.CORPSE_DURATION_SEC) entitiesToRemove.push(id);
    }

    for (const id of entitiesToRemove) {
      this.deadEntities.delete(id);
    }
  }

  private renderDeadEntity(ctx: CanvasRenderingContext2D, deadEntity: DeadEntity): void {
    ctx.save();

    const age = deadEntity.ageSeconds;
    const fadeProgress = Math.min(age / this.CORPSE_DURATION_SEC, 1);

    // Calculate alpha for fade out effect
    const alpha = 0.7 * (1 - fadeProgress * 0.5); // Start at 70% opacity, fade to 35%

    // Draw death effect based on entity type
    this.drawCorpse(ctx, deadEntity, alpha);

    // Add decay particles for older corpses
    if (fadeProgress > 0.5) {
      this.drawDecayParticles(ctx, deadEntity, fadeProgress);
    }

    ctx.restore();
  }

  private drawCorpse(ctx: CanvasRenderingContext2D, deadEntity: DeadEntity, alpha: number): void {
    const { x, y, size, entityType } = deadEntity;

    ctx.globalAlpha = alpha;

    switch (entityType) {
      case "creature":
        this.drawCreatureCorpse(ctx, x, y, size);
        break;
      case "plant":
        this.drawPlantCorpse(ctx, x, y, size);
        break;
      case "robot":
        this.drawRobotCorpse(ctx, x, y, size);
        break;
      default:
        this.drawGenericCorpse(ctx, x, y, size);
        break;
    }
  }

  private drawCreatureCorpse(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ): void {
    // Draw a flattened organic shape
    ctx.fillStyle = "#8B4513"; // Dark brown
    ctx.strokeStyle = "#654321";
    ctx.lineWidth = 2;

    ctx.beginPath();
    // Flattened ellipse to represent a dead creature
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.2, 0.6); // Flatten vertically
    ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
    ctx.restore();
    ctx.fill();
    ctx.stroke();

    // Add some detail marks
    ctx.strokeStyle = "#5D4037";
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i) / 3;
      const startX = x + Math.cos(angle) * size * 0.3;
      const startY = y + Math.sin(angle) * size * 0.2;
      const endX = x + Math.cos(angle) * size * 0.5;
      const endY = y + Math.sin(angle) * size * 0.3;

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  private drawPlantCorpse(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    // Draw withered/dead plant remains
    ctx.fillStyle = "#8B7355"; // Brown
    ctx.strokeStyle = "#5D4E37";
    ctx.lineWidth = 1;

    // Draw dried stem
    ctx.beginPath();
    ctx.rect(x - 2, y - size * 0.3, 4, size * 0.6);
    ctx.fill();
    ctx.stroke();

    // Draw wilted leaves/petals scattered around
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5;
      const leafX = x + Math.cos(angle) * size * 0.4;
      const leafY = y + Math.sin(angle) * size * 0.4;

      ctx.beginPath();
      ctx.save();
      ctx.translate(leafX, leafY);
      ctx.rotate(angle);
      ctx.scale(0.6, 0.3); // Make leaves look wilted
      ctx.arc(0, 0, size * 0.15, 0, Math.PI * 2);
      ctx.restore();
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawRobotCorpse(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    // Draw broken mechanical parts
    ctx.fillStyle = "#696969"; // Dark gray
    ctx.strokeStyle = "#2F2F2F";
    ctx.lineWidth = 2;

    // Main broken body
    ctx.beginPath();
    ctx.rect(x - size * 0.4, y - size * 0.3, size * 0.8, size * 0.6);
    ctx.fill();
    ctx.stroke();

    // Sparking/broken parts
    ctx.fillStyle = "#FFD700"; // Gold for sparks
    for (let i = 0; i < 4; i++) {
      const sparkX = x + (Math.random() - 0.5) * size;
      const sparkY = y + (Math.random() - 0.5) * size;

      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Smoke effect
    ctx.fillStyle = "#555555";
    ctx.globalAlpha *= 0.5;
    for (let i = 0; i < 3; i++) {
      const smokeY = y - size * 0.5 - i * 8;
      ctx.beginPath();
      ctx.arc(x, smokeY, 3 + i, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGenericCorpse(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
  ): void {
    // Generic destroyed entity - just debris
    ctx.fillStyle = "#8B8B8B";
    ctx.strokeStyle = "#555555";
    ctx.lineWidth = 1;

    // Draw scattered debris pieces
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 * i) / 5;
      const debrisX = x + Math.cos(angle) * size * 0.3;
      const debrisY = y + Math.sin(angle) * size * 0.3;
      const debrisSize = 3 + Math.random() * 4;

      ctx.beginPath();
      ctx.rect(debrisX - debrisSize / 2, debrisY - debrisSize / 2, debrisSize, debrisSize);
      ctx.fill();
      ctx.stroke();
    }
  }

  private drawDecayParticles(
    ctx: CanvasRenderingContext2D,
    deadEntity: DeadEntity,
    fadeProgress: number,
  ): void {
    const { x, y, size } = deadEntity;
    const particleCount = Math.floor(3 + fadeProgress * 7);

    ctx.fillStyle = `rgba(139, 69, 19, ${0.3 * (1 - fadeProgress)})`;

    for (let i = 0; i < particleCount; i++) {
      const time = Date.now() * 0.001 + i;
      const particleX = x + Math.sin(time + i) * size * 0.5;
      const particleY = y - Math.abs(Math.cos(time + i)) * size * 0.3;

      ctx.beginPath();
      ctx.arc(particleX, particleY, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  getDeadEntities(): DeadEntity[] {
    return Array.from(this.deadEntities.values());
  }

  removeDeadEntity(id: string): void {
    this.deadEntities.delete(id);
  }

  clear(): void {
    this.deadEntities.clear();
  }
}
