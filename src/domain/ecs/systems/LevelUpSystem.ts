import type { World } from "../../../lib/ecs";
import { Player, PlayerExperience, PlayerPerkPoints } from "../components";
import { xpRequired } from "../../leveling/xp";

export interface LevelUpEvent {
  entityId: number;
  newLevel: number;
  awardedPerkPoints: number;
}

export function createLevelUpSystem(
  world: World,
  onLevelUp: (ev: LevelUpEvent) => void,
): { run(): void } {
  return {
    run(): void {
      const players = world.queryOptional(
        { player: Player, experience: PlayerExperience },
        { perkPoints: PlayerPerkPoints },
      );

      for (const entry of players) {
        const { experience, perkPoints } = entry.components;
        let leveled = false;
        let totalAwarded = 0;

        // Loop in case of multiple level-ups from overflow
        while (experience.current >= experience.toNextLevel) {
          experience.current -= experience.toNextLevel;
          experience.level += 1;
          experience.toNextLevel = xpRequired(experience.level);
          leveled = true;
          totalAwarded += 1; // 1 perk point per level-up for now
        }

        if (leveled) {
          if (perkPoints) {
            perkPoints.unspent += totalAwarded;
          }
          onLevelUp({
            entityId: entry.entity,
            newLevel: experience.level,
            awardedPerkPoints: totalAwarded,
          });
        }
      }
    },
  } as const;
}
