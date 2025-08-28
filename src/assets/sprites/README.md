# Sprite Variants System

This folder structure allows unlimited sprite variants for each game entity.

## Structure

Each entity has its own folder containing different visual styles:

```
sprites/
├── character/           # Player character sprites
├── creature-passive/    # Passive creatures
├── creature-neutral/    # Neutral creatures
├── creature-hostile/    # Hostile creatures
├── ship/               # Player ship
├── enemy-ship/         # Enemy ships
├── thruster/           # Player thruster effects
├── enemy-thruster/     # Enemy thruster effects
├── projectile/         # Projectiles
├── terrain-rock/       # Rock terrain
├── terrain-vegetation/ # Vegetation
├── terrain-structure/  # Structures
├── resource-mineral/   # Mineral resources
├── resource-energy/    # Energy resources
├── resource-organic/   # Organic resources
└── item-*/            # Various item types
```

## Current Variants

- **classic.svg** - Original simple sprites
- **art-deco.svg** - Retro sci-fi art deco style
- **art-deco-1.svg, art-deco-2.svg** - Animation frames (where applicable)

## Adding New Variants

1. Create a new SVG file in the appropriate entity folder
2. Use any filename (e.g., `pixel-art.svg`, `neon.svg`, `sketch.svg`)
3. The settings menu will automatically detect and offer all variants

## Animation Frames

For sprites that move:

- Base sprite: `variant-name.svg`
- Animation frames: `variant-name-1.svg`, `variant-name-2.svg`, etc.
- The system will detect and use animation frames automatically

## Settings Integration

The game will scan these folders to populate sprite variant options in the settings menu, allowing players to mix and match styles for different entities.
