# src/assets/

Game sprites and visual assets. All artwork is stored as SVG files organized by category and entity type.

## Structure

- **`sprites/`** - SVG sprite files organized by game entity categories:
  - `character/` - Player character sprites
  - `creature-*` - Various creature types (hostile, neutral, passive)
  - `enemy-*` - Enemy ships and components
  - `item-*` - All item types (weapons, tools, materials, etc.)
  - `projectile/` - Bullet and projectile sprites
  - `resource-*` - Harvestable resources (energy, mineral, organic)
  - `ship/` - Player ship sprites
  - `terrain-*` - Environment sprites (rocks, structures, vegetation)
  - `thruster/` - Ship thruster sprites
- **`maps/`** - `.losemap.json` files consumed at runtime (e.g., `default-ship.losemap.json` for the player corvette interior)

## Asset Guidelines

**SVG Format**: All sprites must be SVG for scalability and clean rendering at any size.

**Tight Bounds**: SVGs must be tightly bounded to the artwork with no extra padding. Positioning and alignment is handled in code, not in the asset.

**Near Edge Alignment**: When a sprite has an obvious attachment point (like thruster to ship), design the SVG so the attachment edge is at the viewBox boundary.

**Consistent Coordinate Space**: Variants of the same sprite type should use consistent coordinate spaces so rendering math works across all variants.

**Naming Convention**: Files follow the pattern `{category}-{type}.svg` matching the folder structure (e.g., `item-weapon.svg`, `enemy-ship.svg`).

## Usage

Sprites are referenced by their file path in rendering code. The asset organization directly corresponds to game entity categories for easy discovery.
