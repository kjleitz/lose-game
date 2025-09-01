# QA Test Plan: Leveling System, Perks, and Powerups

Use this checklist to validate the leveling system end-to-end: XP gain, level-ups, perk unlocks, and core perk effects (movement, accuracy, loot).

## Setup

- Start dev server: `npm run dev` and open the local URL.
- For a clean slate: Pause menu → Delete Data.
- Controls: Use the in-game Controls panel (top-right) to confirm bindings. Common defaults:
  - Turn: Arrow Left/Right
  - Thrust: Arrow Up; Boost: Shift
  - Fire: Space or Left Mouse
  - Land: L; Takeoff: T

## Baseline Sanity

- Start a session. Expect:
  - Canvas renders with ship and nearby enemies/planets.
  - HUD shows HP/XP panel and a “Perks” button.
  - Radar shows planets; proximity prompt appears when near a planet.

## XP Gain & Leveling

- Land on a planet: Fly close until “Press L to land…” is shown; press L.
- Collect resources: Walk over small resource nodes (≤30px). Expect XP bar percent to increase.
- Level thresholds: The curve is quadratic; Level 1→2 requires 100 XP.
  - Gather ≥100 XP. Expect toast “Level Up! Reached level 2” and the HUD perk badge shows “1 perk”.
  - Overflow: If you exceed 100 in a single collection wave, XP percent resets with leftover carryover.

## HUD Display

- Level: Status panel shows “Lv N”; updates on level-up.
- XP bar: Displays percent to next level (not absolute XP). Resets to near 0% after level-up.
- Perk points: Badge shows unspent count. When 0, a gray “Perks” button is shown instead.

## Perk Modal & Unlock Flow

- Open Perk modal: Click the Perk badge/button.
  - Expect categories (Navigation/Combat/Engineering/Survival), perk cards with tier progress, cost, required level, prerequisites, conflicts, and effect snippets.
- Unlock Targeting Suite (Combat):
  - Precondition: ≥1 perk point; Level ≥1.
  - Click Unlock. Expect: points −1; Targeting Suite becomes Tier 1/2.
- Attempt a conflicting perk:
  - With Targeting Suite unlocked, try Spray and Pray. Expect: unlock disabled or fails due to conflict. Points unchanged; tier remains 0/1.
- Unlock Drift Mastery (Navigation):
  - Precondition: ≥1 perk point; Level ≥1.
  - Expect: points −1; Drift Mastery Tier 1/2.
- Requirements enforcement:
  - Attempt Efficient Burn Tier 2 or Star Cartographer Tier 2 before meeting the required level. Expect: Unlock disabled with clear requirement text.

## Perk Effects: Movement (Drift Mastery)

- Baseline: Without Drift Mastery, hold Left (or Right) for ~1s in space mode; note turn speed and drift feel.
- T1: Unlock Drift Mastery Tier 1; repeat the same input.
  - Expect: noticeably faster turn response; slightly less drift over time (tighter velocity decay).
- T2: Unlock Tier 2; repeat.
  - Expect: further improvement vs T1.

## Perk Effects: Combat (Targeting Suite)

- Baseline: Without Targeting Suite, aim at a distant point and hold fire for ~2s.
  - Observe projectile cone spread (some random jitter around aim).
- T1: Unlock Targeting Suite Tier 1; repeat.
  - Expect: tighter spread (more shots aligned to aim), easier hits on distant enemies.
- T2: Unlock Tier 2; repeat.
  - Expect: slightly tighter spread than T1.

Notes:

- If unsure of the fire binding, confirm in Controls (usually Space or Left Mouse).

## Perk Effects: Loot (Scavenger)

- Baseline: Defeat 5–10 enemies in space; track drops (small squares) and inventory increments.
  - Typical organic_matter stacks are small (e.g., 1–2).
- T1: Unlock Scavenger Tier 1; defeat another 5–10 enemies under similar conditions.
  - Expect: average drop quantities increase (~25%). You should notice bigger stacks on average.
- T2: Unlock Tier 2; repeat again.
  - Expect: further increase (~another 25% over baseline, compounding).

Note on randomness:

- Drops and spread include randomness. Compare at least 10 samples for trends rather than single events.

## Notifications

- Level-up: Toast “Level Up! Reached level X” appears on level change.
- Perk unlock: Perk badge count decreases; the perk card tier increments in the modal. We intentionally keep failure notifications minimal.

## Regression: Legacy XP Increment Removed

- Previously, visiting a planet granted +10 XP in legacy code.
- Validation: Land and take off without collecting resources.
  - Expect: XP percent remains unchanged (no passive XP gain from landing alone).

## Edge Cases

- Multiple level-ups at once:
  - Collect many resources in a burst (e.g., walk through a dense cluster).
  - Expect: multiple level-ups processed; perk points reflect total levels gained; XP percent shows remainder.
- Conflicts and prerequisites:
  - With Targeting Suite unlocked, confirm Spray and Pray remains locked.
  - For tiered perks (e.g., Drift Mastery T2), confirm T1 + level requirement are enforced before T2 is available.

## Optional (Extra Confidence)

- Accuracy benefit in practice: With Targeting Suite, observe faster time-to-kill on distant enemies.
- Movement feel: With Drift Mastery tiers, perform a boost turn (hold thrust/boost + turn) and feel a tighter arc vs baseline.

## Resetting Between Scenarios

- Pause → Delete Data to reset progression and inventory.
- Alternatively, keep playing: stacking perks will compound effects; be mindful when comparing “before/after”.

---

If helpful, ask for a temporary debug overlay to display live level, XP numbers, perk points, active perk tiers, and computed modifiers to accelerate validation.
