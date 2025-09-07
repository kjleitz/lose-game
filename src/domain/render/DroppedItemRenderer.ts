import type { DroppedItem } from "../game/items/DroppedItemSystem";
import type { Item } from "../game/items/Item";
import { drawDroppedItem } from "./sprites";

export class DroppedItemRenderer {
  render(ctx: CanvasRenderingContext2D, droppedItems: DroppedItem[]): void {
    for (const droppedItem of droppedItems) {
      this.renderDroppedItem(ctx, droppedItem);
    }
  }

  private renderDroppedItem(ctx: CanvasRenderingContext2D, droppedItem: DroppedItem): void {
    ctx.save();

    // Calculate floating animation
    const time = Date.now() * 0.002;
    const floatOffset = Math.sin(time + droppedItem.x * 0.01) * 2;

    // Item glow effect
    const glowRadius = 15;
    const glowAlpha = 0.3 + Math.sin(time * 2) * 0.1;

    // Draw glow
    const gradient = ctx.createRadialGradient(
      droppedItem.x,
      droppedItem.y + floatOffset,
      0,
      droppedItem.x,
      droppedItem.y + floatOffset,
      glowRadius,
    );

    const itemColor = this.getItemColor(droppedItem.item);
    gradient.addColorStop(
      0,
      `${itemColor}${Math.floor(glowAlpha * 255)
        .toString(16)
        .padStart(2, "0")}`,
    );
    gradient.addColorStop(1, `${itemColor}00`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(droppedItem.x, droppedItem.y + floatOffset, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw item icon/representation using sprite
    drawDroppedItem(ctx, droppedItem.x, droppedItem.y + floatOffset, droppedItem.item, 18);

    // Draw quantity indicator if more than 1
    if (droppedItem.quantity > 1) {
      this.drawQuantityIndicator(ctx, droppedItem, floatOffset);
    }

    // Draw pickup indicator for nearby items (would be handled by pickup system)
    this.drawPickupHint(ctx, droppedItem, floatOffset);

    ctx.restore();
  }

  // Shape drawing replaced by sprite usage above

  private drawQuantityIndicator(
    ctx: CanvasRenderingContext2D,
    droppedItem: DroppedItem,
    floatOffset: number,
  ): void {
    const x = droppedItem.x + 8;
    const y = droppedItem.y + floatOffset - 8;

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 1;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";

    // Draw background circle
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Draw quantity text
    ctx.fillStyle = "#000000";
    ctx.fillText(droppedItem.quantity.toString(), x, y + 3);
  }

  private drawPickupHint(
    ctx: CanvasRenderingContext2D,
    droppedItem: DroppedItem,
    floatOffset: number,
  ): void {
    // This would be called when player is nearby - for now just draw a subtle pulse
    const time = Date.now() * 0.003;
    const pulseAlpha = 0.2 + Math.sin(time) * 0.1;

    ctx.strokeStyle = `rgba(255, 255, 255, ${pulseAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(droppedItem.x, droppedItem.y + floatOffset, 20, 0, Math.PI * 2);
    ctx.stroke();
  }

  private getItemColor(item: Item): string {
    switch (item.baseType) {
      case "tool":
        return "#4ECDC4"; // Teal
      case "weapon":
        return "#FF6B6B"; // Red
      case "consumable":
        return "#FFD93D"; // Yellow
      case "material":
        return "#A8A8A8"; // Gray
      case "artifact":
        return "#FFD700"; // Gold
      case "seed":
        return "#95E1D3"; // Light green
      default:
        return "#666666"; // Dark gray
    }
  }
}
