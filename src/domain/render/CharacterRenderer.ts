type CtxLike = Pick<
  CanvasRenderingContext2D,
  | "save"
  | "restore"
  | "translate"
  | "rotate"
  | "fillRect"
  | "strokeRect"
  | "beginPath"
  | "ellipse"
  | "fill"
  | "stroke"
  | "arc"
  | "moveTo"
  | "lineTo"
  | "closePath"
  | "globalAlpha"
  | "lineWidth"
  | "strokeStyle"
  | "fillStyle"
  | "shadowBlur"
  | "shadowColor"
> & { canvas: HTMLCanvasElement };

export class CharacterRenderer {
  render(
    ctx: CtxLike,
    player: { x: number; y: number; vx: number; vy: number; angle: number },
    actions: Set<string>,
    size = 24,
  ) {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Rotate to face the direction the player is looking/moving
    ctx.rotate(player.angle);

    // Determine if character is moving
    const isMoving = Math.abs(player.vx) > 1 || Math.abs(player.vy) > 1;
    const isRunning = actions.has("boost");

    // Character body (oval for more directional look)
    ctx.fillStyle = isRunning ? "#FF6B6B" : "#4ECDC4"; // Red when running, teal when walking
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.4, size * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Character outline
    ctx.strokeStyle = "#2C3E50";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw weapon (plasma pistol)
    ctx.fillStyle = "#666";
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 1;

    // Gun barrel
    ctx.fillRect(size * 0.3, -2, size * 0.4, 4);
    ctx.strokeRect(size * 0.3, -2, size * 0.4, 4);

    // Gun grip
    ctx.fillRect(size * 0.15, -3, size * 0.2, 6);
    ctx.strokeRect(size * 0.15, -3, size * 0.2, 6);

    // Firing indicator when space is pressed
    if (actions.has("fire")) {
      ctx.fillStyle = "#00ff88";
      ctx.shadowBlur = 6;
      ctx.shadowColor = "#00ff88";
      ctx.beginPath();
      ctx.arc(size * 0.7, 0, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Head/face direction indicator
    ctx.fillStyle = "#2C3E50";

    // Front-facing indicator (nose/direction marker)
    ctx.beginPath();
    ctx.moveTo(size * 0.2, 0);
    ctx.lineTo(size * 0.35, -3);
    ctx.lineTo(size * 0.35, 3);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.beginPath();
    ctx.arc(size * 0.05, -size * 0.15, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.05, size * 0.15, 2, 0, Math.PI * 2);
    ctx.fill();

    // Movement indicator (legs in direction-oriented coordinate system)
    if (isMoving) {
      const time = Date.now() * 0.01;
      const legOffset = Math.sin(time) * 3;

      ctx.strokeStyle = isRunning ? "#FF6B6B" : "#4ECDC4";
      ctx.lineWidth = 2;

      // Left leg (from body perspective)
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, size * 0.3);
      ctx.lineTo(-size * 0.2 + legOffset, size * 0.5);
      ctx.stroke();

      // Right leg (from body perspective)
      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.3);
      ctx.lineTo(-size * 0.2 - legOffset, -size * 0.5);
      ctx.stroke();

      if (isRunning) {
        // Speed lines when running (behind the character)
        ctx.strokeStyle = "#FFD93D";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;

        for (let i = 0; i < 3; i++) {
          const offset = (i + 1) * 6;
          ctx.beginPath();
          ctx.moveTo(-size * 0.6 - offset, -2 + i * 1);
          ctx.lineTo(-size * 0.6 - offset + 4, -2 + i * 1);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    } else {
      // Static legs when not moving
      ctx.strokeStyle = "#4ECDC4";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(-size * 0.2, size * 0.3);
      ctx.lineTo(-size * 0.2, size * 0.5);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(-size * 0.2, -size * 0.3);
      ctx.lineTo(-size * 0.2, -size * 0.5);
      ctx.stroke();
    }

    ctx.restore();
  }
}
