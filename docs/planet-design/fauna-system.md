# Fauna System Design

## Overview

The fauna system creates diverse, intelligent animal ecosystems across planet surfaces. Creatures exhibit complex behaviors, form social groups, hunt for food, defend territories, and interact with players and the environment. The system emphasizes realistic animal behavior, ecological balance, and meaningful gameplay interactions.

## Core Requirements

- **Behavioral AI**: Creatures exhibit realistic behaviors like foraging, hunting, fleeing, socializing
- **Ecosystem balance**: Predator-prey relationships, food webs, population dynamics
- **Environmental adaptation**: Creatures respond to terrain, climate, and seasonal changes
- **Social structures**: Pack hunting, herds, territorial behavior, mating
- **Player interactions**: Combat, taming, hunting, observation, photography
- **Resource provision**: Meat, hide, bones, special materials when hunted

## Domain Model

### Creature Species

```typescript
enum FaunaCategory {
  HERBIVORE = "herbivore",
  CARNIVORE = "carnivore",
  OMNIVORE = "omnivore",
  SCAVENGER = "scavenger",
  INSECTIVORE = "insectivore",
  AQUATIC = "aquatic",
  FLYING = "flying",
}

enum CreatureSize {
  TINY = "tiny", // insects, small birds
  SMALL = "small", // rabbits, cats
  MEDIUM = "medium", // dogs, deer
  LARGE = "large", // bears, horses
  HUGE = "huge", // elephants, large predators
  GIGANTIC = "gigantic", // fantasy creatures
}

interface FaunaSpecies {
  readonly id: SpeciesId;
  readonly name: string;
  readonly category: FaunaCategory;
  readonly size: CreatureSize;
  readonly stats: CreatureStats;
  readonly behavior: BehaviorProfile;
  readonly habitat: HabitatRequirements;
  readonly social: SocialStructure;
  readonly combat: CombatProfile;
  readonly drops: DropTable;
  readonly appearance: CreatureAppearance;
}

interface CreatureStats {
  readonly health: number;
  readonly speed: number;
  readonly stamina: number;
  readonly strength: number;
  readonly agility: number;
  readonly intelligence: number;
  readonly perception: number; // detection range
  readonly stealth: number; // how hard to spot
}

interface BehaviorProfile {
  readonly personality: PersonalityTraits;
  readonly dailySchedule: ActivitySchedule[];
  readonly foragingBehavior: ForagingBehavior;
  readonly combatBehavior: CombatBehavior;
  readonly flightResponse: FlightResponse;
  readonly curiosity: number; // reaction to new objects/players
  readonly territoriality: number; // how aggressive about territory
}
```

### Creature Instances

```typescript
class CreatureInstance extends DamageableEntity {
  readonly species: FaunaSpecies;
  readonly age: number; // affects size, behavior, drops
  readonly gender: Gender;
  readonly personality: PersonalityModifiers; // individual variations
  readonly currentBehavior: BehaviorState;
  readonly socialGroup?: SocialGroup;
  readonly territory?: Territory;
  readonly needs: CreatureNeeds;
  readonly memory: CreatureMemory;
  readonly relationships: Map<EntityId, Relationship>;

  constructor(species: FaunaSpecies, position: Point) {
    super();
    this.species = species;
    this.age = this.generateAge();
    this.gender = Math.random() < 0.5 ? Gender.MALE : Gender.FEMALE;
    this.personality = this.generatePersonality();
    this.currentBehavior = BehaviorState.IDLE;
    this.needs = new CreatureNeeds();
    this.memory = new CreatureMemory();
  }

  update(dt: number, environment: Environment): void {
    this.updateNeeds(dt);
    this.updateBehavior(dt, environment);
    this.updateSocialInteractions(environment);
    this.updateMovement(dt, environment);
  }
}

interface CreatureNeeds {
  hunger: number; // 0-1, need to find food
  thirst: number; // 0-1, need to find water
  sleep: number; // 0-1, need to rest
  safety: number; // 0-1, need to feel secure
  social: number; // 0-1, need social interaction
  reproduction: number; // 0-1, seasonal mating drive
}

enum BehaviorState {
  IDLE = "idle",
  FORAGING = "foraging",
  HUNTING = "hunting",
  FLEEING = "fleeing",
  FIGHTING = "fighting",
  SOCIALIZING = "socializing",
  SLEEPING = "sleeping",
  PATROLLING = "patrolling",
  MATING = "mating",
  CARING_FOR_YOUNG = "caring",
  MIGRATING = "migrating",
}
```

### Social Systems

```typescript
interface SocialStructure {
  readonly groupType: GroupType;
  readonly minGroupSize: number;
  readonly maxGroupSize: number;
  readonly hierarchy: HierarchyType;
  readonly cooperation: CooperationBehavior;
  readonly communication: CommunicationType[];
}

enum GroupType {
  SOLITARY = "solitary",
  PAIR = "pair",
  FAMILY = "family",
  PACK = "pack",
  HERD = "herd",
  FLOCK = "flock",
  COLONY = "colony",
}

class SocialGroup {
  readonly id: GroupId;
  readonly species: SpeciesId;
  readonly members: CreatureInstance[];
  readonly leader?: CreatureInstance;
  readonly territory?: Territory;
  readonly groupNeeds: GroupNeeds;

  addMember(creature: CreatureInstance): void {
    this.members.push(creature);
    creature.socialGroup = this;
    this.updateHierarchy();
  }

  removeMember(creature: CreatureInstance): void {
    const index = this.members.indexOf(creature);
    if (index >= 0) {
      this.members.splice(index, 1);
      creature.socialGroup = undefined;
      this.updateHierarchy();
    }
  }

  makeGroupDecision(situation: Situation): GroupAction {
    // Group decision-making based on leader and member input
    if (this.leader) {
      return this.leader.makeDecision(situation, this.members);
    } else {
      return this.democraticDecision(situation);
    }
  }
}
```

## System Architecture

### Domain Layer (`src/domain/game/fauna/`)

```
fauna/
├── FaunaSpecies.ts         # Species definitions and properties
├── CreatureInstance.ts     # Individual creature instances
├── CreatureBehavior.ts     # Behavior tree and AI logic
├── SocialSystem.ts         # Group dynamics and interactions
├── CombatBehavior.ts       # Fighting and hunting mechanics
├── ReproductionSystem.ts   # Mating and offspring mechanics
├── species/                # Individual species definitions
│   ├── Herbivores.ts
│   ├── Carnivores.ts
│   ├── AquaticCreatures.ts
│   ├── FlyingCreatures.ts
│   └── FantasyCreatures.ts
├── behaviors/              # Behavior tree nodes
│   ├── ForagingBehavior.ts
│   ├── HuntingBehavior.ts
│   ├── FleeingBehavior.ts
│   ├── SocialBehavior.ts
│   └── TerritorialBehavior.ts
└── services/
    ├── FaunaService.ts     # Fauna management and queries
    ├── EcosystemService.ts # Population dynamics
    └── BehaviorService.ts  # Behavior execution
```

### AI Layer (`src/domain/ai/fauna/`)

```
fauna/
├── CreatureBehaviorTree.ts # Behavior tree for creatures
├── DecisionMaking.ts       # Decision algorithms
├── PathFinding.ts         # Navigation for creatures
├── GroupCoordination.ts   # Pack/herd behaviors
├── HuntingAI.ts          # Predator hunting logic
├── FlockingAI.ts         # Herding and flocking
└── CommunicationAI.ts    # Inter-creature communication
```

### Rendering Layer (`src/domain/render/fauna/`)

```
fauna/
├── CreatureRenderer.ts     # Master creature rendering
├── CreatureSprite.ts       # Individual creature sprites
├── AnimationController.ts  # Creature animations
├── SocialIndicators.ts     # Group relationship visualization
└── BehaviorIndicators.ts   # Visual behavior cues
```

## Implementation Details

### Behavior Tree System

```typescript
class CreatureBehaviorTree extends BehaviorTree {
  constructor(creature: CreatureInstance) {
    super();

    this.root = new Selector([
      // Emergency behaviors (highest priority)
      new Sequence([new Condition(() => creature.isInDanger()), new FleeingBehavior(creature)]),

      // Survival needs
      new Sequence([
        new Condition(() => creature.needs.hunger > 0.8),
        new ForagingBehavior(creature),
      ]),

      new Sequence([
        new Condition(() => creature.needs.thirst > 0.8),
        new SeekWaterBehavior(creature),
      ]),

      // Social behaviors
      new Sequence([
        new Condition(() => creature.needs.social > 0.6 && creature.hasNearbyGroupMembers()),
        new SocializingBehavior(creature),
      ]),

      // Territorial behaviors
      new Sequence([
        new Condition(() => creature.isInTerritory() && creature.detectsIntruder()),
        new TerritorialBehavior(creature),
      ]),

      // Default behavior
      new IdleBehavior(creature),
    ]);
  }
}
```

### Foraging Behavior

```typescript
class ForagingBehavior extends BehaviorNode {
  constructor(private creature: CreatureInstance) {
    super();
  }

  execute(dt: number, environment: Environment): BehaviorResult {
    // Different foraging strategies based on species
    switch (this.creature.species.category) {
      case FaunaCategory.HERBIVORE:
        return this.forageForPlants(dt, environment);
      case FaunaCategory.CARNIVORE:
        return this.huntForPrey(dt, environment);
      case FaunaCategory.OMNIVORE:
        return this.opportunisticForaging(dt, environment);
      case FaunaCategory.SCAVENGER:
        return this.scavengeCarrion(dt, environment);
    }

    return BehaviorResult.FAILURE;
  }

  private forageForPlants(dt: number, environment: Environment): BehaviorResult {
    // Look for suitable plants within perception range
    const plants = environment.getNearbyFlora(
      this.creature.position,
      this.creature.stats.perception,
    );
    const suitablePlants = plants.filter((plant) => this.isEdiblePlant(plant));

    if (suitablePlants.length === 0) {
      // Wander to find food
      this.wanderForFood();
      return BehaviorResult.RUNNING;
    }

    // Move to closest suitable plant
    const targetPlant = this.findClosestPlant(suitablePlants);
    if (this.isNearTarget(targetPlant)) {
      // Eat the plant
      this.consumePlant(targetPlant);
      this.creature.needs.hunger -= 0.3;
      return BehaviorResult.SUCCESS;
    } else {
      // Move towards plant
      this.moveToward(targetPlant.position);
      return BehaviorResult.RUNNING;
    }
  }
}
```

### Pack Hunting Behavior

```typescript
class PackHuntingBehavior extends BehaviorNode {
  execute(dt: number, environment: Environment): BehaviorResult {
    const pack = this.creature.socialGroup;
    if (!pack || pack.members.length < 2) {
      return BehaviorResult.FAILURE; // Can't pack hunt alone
    }

    // Leader coordinates the hunt
    if (this.creature === pack.leader) {
      return this.leadHunt(dt, environment, pack);
    } else {
      return this.followPackLead(dt, environment, pack);
    }
  }

  private leadHunt(dt: number, environment: Environment, pack: SocialGroup): BehaviorResult {
    // Find suitable prey
    const potentialPrey = environment.getNearbyCreatures(
      this.creature.position,
      this.creature.stats.perception,
    );
    const suitablePrey = potentialPrey.filter((prey) => this.canHunt(prey, pack));

    if (suitablePrey.length === 0) {
      return BehaviorResult.FAILURE;
    }

    const target = this.selectBestTarget(suitablePrey, pack);

    // Coordinate pack positions
    const huntPlan = this.createHuntPlan(target, pack);

    // Communicate plan to pack members
    for (const member of pack.members) {
      if (member !== this.creature) {
        member.receiveHuntCommand(huntPlan.getRole(member));
      }
    }

    // Execute leader's role
    return this.executeHuntRole(huntPlan.leaderRole, target);
  }

  private createHuntPlan(prey: CreatureInstance, pack: SocialGroup): HuntPlan {
    // Create coordinated attack plan
    return {
      target: prey,
      leaderRole: "direct_attack",
      memberRoles: new Map([
        [pack.members[1], "flank_left"],
        [pack.members[2], "flank_right"],
        [pack.members[3], "cut_off_escape"],
      ]),
    };
  }
}
```

### Ecosystem Population Control

```typescript
class EcosystemService {
  updatePopulations(dt: number, environment: Environment): void {
    // Track population levels by species
    const populations = this.getCurrentPopulations();

    for (const [speciesId, population] of populations) {
      const species = this.getSpecies(speciesId);
      const carryingCapacity = this.calculateCarryingCapacity(species, environment);

      // Population growth/decline based on resources and predation
      if (population.size < carryingCapacity) {
        this.attemptReproduction(population, environment);
      } else if (population.size > carryingCapacity) {
        this.increaseNaturalDeath(population);
      }

      // Predator-prey dynamics
      this.updatePredatorPreyRelationships(species, populations);
    }
  }

  private updatePredatorPreyRelationships(
    species: FaunaSpecies,
    populations: Map<SpeciesId, Population>,
  ): void {
    if (species.category === FaunaCategory.CARNIVORE) {
      const preySpecies = this.getPreySpecies(species);
      let totalPreyPopulation = 0;

      for (const preySpeciesId of preySpecies) {
        const preyPop = populations.get(preySpeciesId);
        if (preyPop) {
          totalPreyPopulation += preyPop.size;
        }
      }

      const predatorPop = populations.get(species.id);
      if (predatorPop) {
        // Adjust predator success rate based on prey availability
        const preyPredatorRatio = totalPreyPopulation / predatorPop.size;
        const huntSuccessRate = this.calculateHuntSuccessRate(preyPredatorRatio);

        // Update hunger levels for all predators
        for (const predator of predatorPop.members) {
          predator.huntSuccessModifier = huntSuccessRate;
        }
      }
    }
  }
}
```

## Species Examples

### Wolf (Pack Predator)

```typescript
const WOLF: FaunaSpecies = {
  id: "wolf",
  name: "Gray Wolf",
  category: FaunaCategory.CARNIVORE,
  size: CreatureSize.MEDIUM,
  stats: {
    health: 150,
    speed: 280,
    stamina: 200,
    strength: 18,
    agility: 16,
    intelligence: 20, // high intelligence for pack coordination
    perception: 25, // excellent senses
    stealth: 14,
  },
  behavior: {
    personality: {
      aggression: 0.7,
      boldness: 0.6,
      sociability: 0.9, // highly social
      curiosity: 0.5,
      playfulness: 0.4,
    },
    territoriality: 0.8, // very territorial
    flightResponse: { threshold: 0.3, distance: 200 },
  },
  social: {
    groupType: GroupType.PACK,
    minGroupSize: 3,
    maxGroupSize: 12,
    hierarchy: HierarchyType.ALPHA_DOMINANCE,
    cooperation: {
      hunting: true,
      defense: true,
      childcare: true,
    },
  },
  combat: {
    attackDamage: 35,
    attackSpeed: 1.2,
    attackRange: 2,
    criticalChance: 0.15,
    preferredTargets: ["deer", "elk", "rabbit"],
  },
  drops: {
    guaranteed: [
      { itemType: "wolf_meat", minQuantity: 4, maxQuantity: 6 },
      { itemType: "wolf_pelt", minQuantity: 1, maxQuantity: 1 },
    ],
    possible: [
      { itemType: "wolf_teeth", quantity: 2, probability: 0.4 },
      { itemType: "bones", quantity: 3, probability: 0.7 },
    ],
  },
};
```

### Deer (Herd Herbivore)

```typescript
const DEER: FaunaSpecies = {
  id: "deer",
  name: "White-tailed Deer",
  category: FaunaCategory.HERBIVORE,
  size: CreatureSize.MEDIUM,
  stats: {
    health: 80,
    speed: 320, // very fast for escaping
    stamina: 150,
    strength: 12,
    agility: 22, // excellent agility for dodging
    intelligence: 12,
    perception: 20, // good senses for predator detection
    stealth: 18, // naturally camouflaged
  },
  behavior: {
    personality: {
      aggression: 0.2, // generally peaceful
      boldness: 0.3, // quite skittish
      sociability: 0.7, // prefer groups
      curiosity: 0.4,
      playfulness: 0.3,
    },
    territoriality: 0.1, // not territorial
    flightResponse: { threshold: 0.8, distance: 400 }, // flee at first sign of danger
  },
  social: {
    groupType: GroupType.HERD,
    minGroupSize: 4,
    maxGroupSize: 20,
    hierarchy: HierarchyType.AGE_BASED,
    cooperation: {
      alertness: true, // sentries watch for predators
      defense: false, // scatter when threatened
      childcare: true,
    },
  },
  drops: {
    guaranteed: [
      { itemType: "venison", minQuantity: 6, maxQuantity: 10 },
      { itemType: "deer_hide", minQuantity: 1, maxQuantity: 2 },
    ],
    possible: [
      { itemType: "antlers", quantity: 2, probability: 0.5, condition: { gender: "male" } },
      { itemType: "bones", quantity: 4, probability: 0.8 },
    ],
  },
};
```

### Bear (Solitary Omnivore)

```typescript
const BEAR: FaunaSpecies = {
  id: "brown_bear",
  name: "Brown Bear",
  category: FaunaCategory.OMNIVORE,
  size: CreatureSize.LARGE,
  stats: {
    health: 300,
    speed: 240,
    stamina: 180,
    strength: 28, // very strong
    agility: 10, // not very agile
    intelligence: 16,
    perception: 18,
    stealth: 8, // hard to hide due to size
  },
  behavior: {
    personality: {
      aggression: 0.6,
      boldness: 0.8, // confident due to size
      sociability: 0.1, // mostly solitary
      curiosity: 0.6,
      playfulness: 0.2,
    },
    territoriality: 0.9, // very territorial
    flightResponse: { threshold: 0.1, distance: 50 }, // rarely flees
  },
  social: {
    groupType: GroupType.SOLITARY,
    minGroupSize: 1,
    maxGroupSize: 1,
    hierarchy: HierarchyType.NONE,
  },
  combat: {
    attackDamage: 60,
    attackSpeed: 0.8,
    attackRange: 3,
    criticalChance: 0.2,
    intimidation: 0.9, // scares most other creatures
  },
  drops: {
    guaranteed: [
      { itemType: "bear_meat", minQuantity: 12, maxQuantity: 18 },
      { itemType: "bear_pelt", minQuantity: 1, maxQuantity: 1 },
    ],
    possible: [
      { itemType: "bear_claws", quantity: 4, probability: 0.6 },
      { itemType: "bear_fat", quantity: 3, probability: 0.8 },
    ],
  },
};
```

## Integration Points

### With Flora System

```typescript
interface FoodChain {
  readonly herbivores: Map<SpeciesId, PlantType[]>; // what each herbivore eats
  readonly carnivores: Map<SpeciesId, SpeciesId[]>; // predator-prey relationships
  readonly omnivores: Map<SpeciesId, { plants: PlantType[]; prey: SpeciesId[] }>;
}

class EcosystemBalance {
  calculateFloralPressure(creatures: CreatureInstance[], flora: FloraInstance[]): void {
    // Herbivores reduce plant populations
    for (const creature of creatures.filter(
      (c) => c.species.category === FaunaCategory.HERBIVORE,
    )) {
      const consumptionRate = creature.species.stats.strength * 0.1;
      // Remove flora around herbivore locations
      this.simulateGrazing(creature, flora, consumptionRate);
    }
  }
}
```

### With Player Interaction

```typescript
interface PlayerCreatureInteraction {
  readonly interactionType: "hunt" | "tame" | "observe" | "photograph" | "feed";
  readonly requirements: InteractionRequirement[];
  readonly outcomes: InteractionOutcome[];
}

class CreatureInteractionSystem {
  handlePlayerApproach(player: Player, creature: CreatureInstance): void {
    const reaction = this.calculateReaction(creature, player);

    switch (reaction) {
      case CreatureReaction.FLEE:
        creature.currentBehavior = BehaviorState.FLEEING;
        creature.fleeFrom(player.position);
        break;
      case CreatureReaction.AGGRESSIVE:
        creature.currentBehavior = BehaviorState.FIGHTING;
        creature.setTarget(player);
        break;
      case CreatureReaction.CURIOUS:
        creature.currentBehavior = BehaviorState.IDLE;
        creature.lookAt(player.position);
        break;
      case CreatureReaction.IGNORE:
        // Continue current behavior
        break;
    }
  }
}
```

### With Combat System

```typescript
class CreatureCombat {
  executeAttack(attacker: CreatureInstance, target: DamageableEntity): CombatResult {
    const damage = this.calculateDamage(attacker);
    const accuracy = this.calculateAccuracy(attacker, target);

    if (Math.random() > accuracy) {
      return { hit: false, damage: 0 };
    }

    // Apply damage with creature-specific damage type
    const damageEvent: DamageEvent = {
      amount: damage,
      type: attacker.species.combat.damageType,
      source: { entityId: attacker.id, sourceType: "creature" },
      critical: Math.random() < attacker.species.combat.criticalChance,
    };

    const result = this.damageSystem.processDamage(target, damageEvent);

    // Creature gains experience/satisfaction from successful hunt
    if (result.killed && target instanceof CreatureInstance) {
      attacker.needs.hunger -= 0.4;
      attacker.gainHuntingExperience(target.species.size);
    }

    return { hit: true, damage: result.damageDealt, killed: result.killed };
  }
}
```

## Performance Considerations

### Behavioral LOD

```typescript
class BehaviorLOD {
  updateCreatureLOD(creatures: CreatureInstance[], player: Player): void {
    for (const creature of creatures) {
      const distance = Vector.distance(creature.position, player.position);

      if (distance < 100) {
        creature.behaviorLOD = BehaviorLOD.FULL; // full AI, all behaviors
      } else if (distance < 500) {
        creature.behaviorLOD = BehaviorLOD.MEDIUM; // basic AI, simplified behaviors
      } else {
        creature.behaviorLOD = BehaviorLOD.LOW; // minimal AI, just essential needs
      }
    }
  }
}
```

### Creature Pooling

```typescript
class CreaturePool {
  private pools: Map<SpeciesId, CreatureInstance[]> = new Map();

  spawn(species: FaunaSpecies, position: Point): CreatureInstance {
    const pool = this.pools.get(species.id) || [];
    const creature = pool.pop() || new CreatureInstance(species, position);

    creature.reset(position);
    return creature;
  }

  despawn(creature: CreatureInstance): void {
    const pool = this.pools.get(creature.species.id) || [];
    pool.push(creature);
    this.pools.set(creature.species.id, pool);
  }
}
```

## Testing Strategy

### Unit Tests

- **Behavior Trees**: Test individual behavior nodes work correctly
- **Social Dynamics**: Verify pack formation and group decision making
- **Combat Mechanics**: Test damage calculations and combat outcomes
- **Population Dynamics**: Verify ecosystem balance algorithms

### Integration Tests

- **Predator-Prey Relationships**: Test population cycles work realistically
- **Habitat Suitability**: Verify creatures spawn in appropriate environments
- **Player Interactions**: Test all player-creature interaction types
- **Performance**: Benchmark AI performance with large creature populations

### Ecological Tests

- **Food Web Stability**: Ensure ecosystems reach stable states
- **Migration Patterns**: Test seasonal movement behaviors
- **Resource Competition**: Verify creatures compete appropriately for resources

## Success Metrics

- **Behavioral Realism**: Creatures exhibit recognizable animal behaviors
- **Performance**: Maintain 60fps with 200+ active creatures
- **Ecosystem Stability**: Populations stabilize within 20% of carrying capacity
- **Player Engagement**: Creature interactions feel meaningful and rewarding
- **Visual Appeal**: Creatures are visually distinct and well-animated
