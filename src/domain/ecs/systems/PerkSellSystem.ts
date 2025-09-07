import { Entity, type World } from "../../../lib/ecs";
import { Perks, Player, PlayerPerkPoints } from "../components";
import type { PerkDefinition, PerkId } from "../../leveling/types";

export interface PerkSellRequest {
  entityId: number;
  perkId: PerkId;
}

export interface PerkSellResult {
  entityId: number;
  perkId: PerkId;
  success: boolean;
  reason?: string;
}

export function createPerkSellSystem(
  world: World,
  requests: PerkSellRequest[],
  perkDefs: readonly PerkDefinition[],
  onResult: (res: PerkSellResult) => void,
): { run(): void } {
  const defById = new Map(perkDefs.map((def) => [def.id, def] as const));
  return {
    run(): void {
      if (requests.length === 0) return;

      const players = world.queryOptional(
        { player: Player, perks: Perks },
        { perkPoints: PlayerPerkPoints },
      );

      const playerEntity = players.length > 0 ? players[0] : undefined;
      if (!playerEntity) {
        // Clear queue; cannot process without a player
        requests.length = 0;
        return;
      }

      const { perks, perkPoints } = playerEntity.components;
      const unlocked = perks.unlocked;

      while (requests.length > 0) {
        const req = requests.shift()!;
        const def = defById.get(req.perkId);
        if (!def) {
          onResult({
            entityId: req.entityId,
            perkId: req.perkId,
            success: false,
            reason: "unknown_perk",
          });
          continue;
        }
        if (!def.implemented) {
          onResult({
            entityId: req.entityId,
            perkId: req.perkId,
            success: false,
            reason: "unimplemented",
          });
          continue;
        }

        const currentTier = unlocked[def.id] ?? 0;
        if (currentTier <= 0) {
          onResult({
            entityId: req.entityId,
            perkId: req.perkId,
            success: false,
            reason: "not_unlocked",
          });
          continue;
        }

        // Selling from tier 1 to 0 might break other perks that require this one.
        // Block selling if any currently-unlocked perk tier requires this one.
        if (currentTier === 1) {
          const blocks = perkDefs.find((other) => {
            if (other.id === def.id) return false;
            const otherTier = unlocked[other.id] ?? 0;
            if (otherTier <= 0) return false;
            const activeTier = other.tiers[otherTier - 1];
            const requires = activeTier.requires ?? [];
            return requires.includes(def.id);
          });
          if (blocks) {
            onResult({
              entityId: req.entityId,
              perkId: req.perkId,
              success: false,
              reason: "required_by_other",
            });
            continue;
          }
        }

        // Refund the cost of the tier being removed.
        const refundTier = def.tiers[currentTier - 1];
        const refund = refundTier.cost;
        if (!perkPoints) {
          new Entity(playerEntity.entity, world).addComponent(PlayerPerkPoints, {
            unspent: refund,
          });
        } else {
          perkPoints.unspent += refund;
        }

        // Decrement unlocked tier.
        const nextTier = currentTier - 1;
        unlocked[def.id] = nextTier;

        // Selling may have level requirements on higher tiers when re-buying later; no further action needed.
        // Notify success
        onResult({ entityId: req.entityId, perkId: req.perkId, success: true });
      }
    },
  } as const;
}
