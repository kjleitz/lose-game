import type { World } from "../../../lib/ecs";
import { Perks, Player, PlayerExperience, PlayerPerkPoints } from "../components";
import type { PerkDefinition, PerkId } from "../../leveling/types";

export interface PerkUnlockRequest {
  entityId: number;
  perkId: PerkId;
}

export interface PerkUnlockResult {
  entityId: number;
  perkId: PerkId;
  success: boolean;
  reason?: string;
}

export function createPerkUnlockSystem(
  world: World,
  requests: PerkUnlockRequest[],
  perkDefs: readonly PerkDefinition[],
  onResult: (res: PerkUnlockResult) => void,
): { run(): void } {
  const defById = new Map(perkDefs.map((def) => [def.id, def] as const));
  return {
    run(): void {
      if (requests.length === 0) return;

      const players = world.queryOptional(
        { player: Player, experience: PlayerExperience, perks: Perks },
        { perkPoints: PlayerPerkPoints },
      );

      const playerEntity = players.length > 0 ? players[0] : undefined;
      if (!playerEntity) {
        // Clear queue; cannot process without a player
        requests.length = 0;
        return;
      }

      const { experience, perks, perkPoints } = playerEntity.components;
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
        const nextTierIdx = currentTier; // tiers are 1-based; index 0 -> tier 1
        if (nextTierIdx >= def.tiers.length) {
          onResult({
            entityId: req.entityId,
            perkId: req.perkId,
            success: false,
            reason: "max_tier",
          });
          continue;
        }
        const nextTier = def.tiers[nextTierIdx];
        // Check level requirement
        if (nextTier.requiresLevel != null && experience.level < nextTier.requiresLevel) {
          onResult({
            entityId: req.entityId,
            perkId: req.perkId,
            success: false,
            reason: "low_level",
          });
          continue;
        }
        // Check prerequisites
        const requires = nextTier.requires ?? [];
        const missing = requires.find((rid) => (unlocked[rid] ?? 0) <= 0);
        if (missing != null) {
          onResult({
            entityId: req.entityId,
            perkId: req.perkId,
            success: false,
            reason: "missing_prereq",
          });
          continue;
        }
        // Check exclusions
        const excludes = nextTier.excludes ?? [];
        const conflict = excludes.find((eid) => (unlocked[eid] ?? 0) > 0);
        if (conflict) {
          onResult({
            entityId: req.entityId,
            perkId: req.perkId,
            success: false,
            reason: "conflict",
          });
          continue;
        }
        // Check points
        const cost = nextTier.cost;
        if (!perkPoints || perkPoints.unspent < cost) {
          onResult({
            entityId: req.entityId,
            perkId: req.perkId,
            success: false,
            reason: "no_points",
          });
          continue;
        }
        // All good: spend and unlock next tier
        perkPoints.unspent -= cost;
        unlocked[def.id] = currentTier + 1;
        onResult({ entityId: req.entityId, perkId: req.perkId, success: true });
      }
    },
  } as const;
}
