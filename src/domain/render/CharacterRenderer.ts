export class CharacterRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    player: { x: number; y: number; vx: number; vy: number; angle: number },
    actions: Set<string>,
    size = 24,
  ) {
    ctx.save();
    ctx.translate(player.x, player.y);

    // Determine if character is moving
    const isMoving = Math.abs(player.vx) > 1 || Math.abs(player.vy) > 1;
    const isRunning = actions.has("boost");

    // Character body (circle)
    ctx.fillStyle = isRunning ? "#FF6B6B" : "#4ECDC4"; // Red when running, teal when walking
    ctx.beginPath();
    ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Character outline
    ctx.strokeStyle = "#2C3E50";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Simple face
    ctx.fillStyle = "#2C3E50";

    // Eyes
    ctx.beginPath();
    ctx.arc(-size * 0.15, -size * 0.1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.15, -size * 0.1, 2, 0, Math.PI * 2);
    ctx.fill();

    // Simple mouth (smile or neutral based on movement)
    ctx.beginPath();
    if (isMoving) {
      // Happy face when moving
      ctx.arc(0, size * 0.1, size * 0.2, 0, Math.PI);
    } else {
      // Neutral face when still
      ctx.moveTo(-size * 0.1, size * 0.2);
      ctx.lineTo(size * 0.1, size * 0.2);
    }
    ctx.lineWidth = 1;
    ctx.stroke();

    // Movement indicator (simple legs/motion lines)
    if (isMoving) {
      const time = Date.now() * 0.01;
      const legOffset = Math.sin(time) * 5;

      ctx.strokeStyle = isRunning ? "#FF6B6B" : "#4ECDC4";
      ctx.lineWidth = 3;

      // Left leg
      ctx.beginPath();
      ctx.moveTo(-size * 0.3, size * 0.4);
      ctx.lineTo(-size * 0.3 + legOffset, size * 0.7);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(size * 0.3, size * 0.4);
      ctx.lineTo(size * 0.3 - legOffset, size * 0.7);
      ctx.stroke();

      if (isRunning) {
        // Speed lines when running
        ctx.strokeStyle = "#FFD93D";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;

        for (let i = 0; i < 3; i++) {
          const offset = (i + 1) * 8;
          ctx.beginPath();
          ctx.moveTo(-size - offset, -3 + i * 2);
          ctx.lineTo(-size - offset + 6, -3 + i * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    } else {
      // Static legs when not moving
      ctx.strokeStyle = "#4ECDC4";
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(-size * 0.3, size * 0.4);
      ctx.lineTo(-size * 0.3, size * 0.7);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(size * 0.3, size * 0.4);
      ctx.lineTo(size * 0.3, size * 0.7);
      ctx.stroke();
    }

    ctx.restore();
  }
}
