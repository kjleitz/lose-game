import { World, defineComponent, defineSystem } from "../src/index.js";

// Game components
const Position = defineComponent<{ x: number; y: number }>();
const Velocity = defineComponent<{ dx: number; dy: number }>();
const Health = defineComponent<{ current: number; max: number }>();
const Damage = defineComponent<{ amount: number }>();
const PlayerControlled = defineComponent<{}>(() => ({}));
const Enemy = defineComponent<{}>(() => ({}));
const Projectile = defineComponent<{
  timeToLive: number;
  ownerId: number;
}>();

// Game simulation
class GameSimulation {
  private world = new World();
  private frame = 0;

  init() {
    this.createPlayer();
    this.createEnemies();
    this.setupSystems();
  }

  private createPlayer() {
    return this.world
      .createEntity()
      .addComponent(Position, { x: 50, y: 50 })
      .addComponent(Velocity, { dx: 0, dy: 0 })
      .addComponent(Health, { current: 100, max: 100 })
      .addComponent(PlayerControlled);
  }

  private createEnemies() {
    // Create a few enemies
    for (let i = 0; i < 3; i++) {
      this.world
        .createEntity()
        .addComponent(Position, {
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
        })
        .addComponent(Velocity, {
          dx: (Math.random() - 0.5) * 2,
          dy: (Math.random() - 0.5) * 2,
        })
        .addComponent(Health, { current: 30, max: 30 })
        .addComponent(Enemy);
    }
  }

  private setupSystems() {
    // Movement system - applies velocity to position
    const MovementSystem = defineSystem(this.world)
      .withComponents({ Position, Velocity })
      .execute((entities) => {
        entities.forEach(({ components: { Position, Velocity } }) => {
          Position.x += Velocity.dx;
          Position.y += Velocity.dy;

          // Keep entities in bounds
          Position.x = Math.max(0, Math.min(500, Position.x));
          Position.y = Math.max(0, Math.min(400, Position.y));
        });
      });

    // AI system - simple enemy behavior
    const AISystem = defineSystem(this.world)
      .withComponents({ Position, Velocity, Enemy })
      .execute((entities) => {
        const playerEntities = this.world.query({ Position, PlayerControlled });
        if (playerEntities.length === 0) return;

        const playerPos = playerEntities[0].components.Position;

        entities.forEach(({ entity, components: { Position, Velocity } }) => {
          // Simple AI: move toward player
          const dx = playerPos.x - Position.x;
          const dy = playerPos.y - Position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            const speed = 1;
            Velocity.dx = (dx / distance) * speed;
            Velocity.dy = (dy / distance) * speed;
          }

          // Randomly shoot
          if (Math.random() < 0.02) {
            this.createProjectile(Position.x, Position.y, entity, dx, dy);
          }
        });
      });

    // Projectile system
    const ProjectileSystem = defineSystem(this.world)
      .withComponents({ Position, Velocity, Projectile })
      .execute((entities) => {
        entities.forEach(({ entity, components: { Projectile } }) => {
          Projectile.timeToLive--;

          if (Projectile.timeToLive <= 0) {
            this.world.removeEntity(entity);
          }
        });
      });

    // Combat system - handle damage
    const CombatSystem = defineSystem(this.world)
      .withComponents({ Position, Health })
      .execute((entities) => {
        const projectiles = this.world.query({ Position, Projectile, Damage });

        entities.forEach(({ entity, components: { Position: targetPos, Health } }) => {
          projectiles.forEach(
            ({ entity: projEntity, components: { Position: projPos, Projectile, Damage } }) => {
              if (Projectile.ownerId === entity) return; // Can't hit self

              const dx = targetPos.x - projPos.x;
              const dy = targetPos.y - projPos.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance < 20) {
                // Hit!
                Health.current -= Damage.amount;
                this.world.removeEntity(projEntity);

                if (Health.current <= 0) {
                  console.log(`Entity ${entity} destroyed!`);
                  this.world.removeEntity(entity);
                }
              }
            },
          );
        });
      });

    // Register all systems
    this.world.addSystem(MovementSystem);
    this.world.addSystem(AISystem);
    this.world.addSystem(ProjectileSystem);
    this.world.addSystem(CombatSystem);
  }

  private createProjectile(x: number, y: number, ownerId: number, dx: number, dy: number) {
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 3;

    this.world
      .createEntity()
      .addComponent(Position, { x, y })
      .addComponent(Velocity, {
        dx: distance > 0 ? (dx / distance) * speed : 0,
        dy: distance > 0 ? (dy / distance) * speed : 0,
      })
      .addComponent(Projectile, { timeToLive: 120, ownerId })
      .addComponent(Damage, { amount: 10 });
  }

  update() {
    this.frame++;
    console.log(`\n=== Frame ${this.frame} ===`);

    // Log entity counts
    const players = this.world.query({ PlayerControlled });
    const enemies = this.world.query({ Enemy });
    const projectiles = this.world.query({ Projectile });

    console.log(
      `Players: ${players.length}, Enemies: ${enemies.length}, Projectiles: ${projectiles.length}`,
    );

    this.world.runSystems();

    // Log player health
    if (players.length > 0) {
      const playerHealth = this.world.query({ PlayerControlled, Health })[0];
      if (playerHealth) {
        console.log(
          `Player Health: ${playerHealth.components.Health.current}/${playerHealth.components.Health.max}`,
        );
      }
    }
  }

  isGameOver(): boolean {
    const players = this.world.query({ PlayerControlled });
    return players.length === 0;
  }
}

// Run simulation
const game = new GameSimulation();
game.init();

// Run for 10 frames
for (let i = 0; i < 10 && !game.isGameOver(); i++) {
  game.update();
}

if (game.isGameOver()) {
  console.log("\nGame Over!");
} else {
  console.log("\nSimulation complete!");
}
