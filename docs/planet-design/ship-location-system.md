# Ship Location and Return System Design

## Overview

The ship location system manages where the player's spaceship lands on planets and ensures they can find their way back to takeoff. It provides clear navigation aids, handles ship security, and creates meaningful gameplay around the relationship between ship location and exploration range.

## Core Requirements

- **Fixed landing location**: Ship stays where it landed until player returns
- **Navigation aids**: Players can always find their way back to the ship
- **Exploration radius**: Ship location affects practical exploration range
- **Ship security**: Protect ship from environmental damage and creatures
- **Landing site selection**: Smart placement avoiding hazards and obstacles
- **Visual prominence**: Ship is clearly visible and recognizable
- **Storage access**: Ship can serve as expanded storage when nearby

## Domain Model

### Ship Location System

```typescript
interface ShipLocation {
  readonly id: ShipLocationId;
  readonly planetId: PlanetId;
  readonly position: Point;
  readonly landingTime: number; // when ship landed
  readonly landingSite: LandingSite;
  readonly navigationBeacon: NavigationBeacon;
  readonly securityStatus: ShipSecurityStatus;
  readonly accessibleSystems: ShipSystem[];
}

interface LandingSite {
  readonly suitability: LandingSuitability;
  readonly terrain: TerrainType;
  readonly clearance: number; // radius of clear space around ship
  readonly elevation: number;
  readonly hazards: EnvironmentalHazard[];
  readonly landmarks: Landmark[]; // nearby notable features
}

enum LandingSuitability {
  IDEAL = "ideal", // flat, clear, safe
  GOOD = "good", // minor obstacles/hazards
  POOR = "poor", // difficult terrain or hazards
  DANGEROUS = "dangerous", // active hazards present
}

enum ShipSecurityStatus {
  SECURE = "secure", // no threats detected
  MONITORED = "monitored", // potential threats nearby
  THREATENED = "threatened", // active threats present
  DAMAGED = "damaged", // ship has taken damage
}

interface NavigationBeacon {
  readonly active: boolean;
  readonly range: number; // distance at which beacon is visible
  readonly signalStrength: number; // affected by terrain/weather
  readonly visualIndicators: VisualIndicator[];
  readonly audioSignals: AudioSignal[];
}
```

### Navigation System

```typescript
interface NavigationAid {
  readonly type: NavigationAidType;
  readonly direction: Vector; // direction to ship
  readonly distance: number; // distance to ship
  readonly visibility: boolean; // can player see ship directly?
  readonly estimatedTime: number; // travel time to ship
  readonly obstacles: NavigationObstacle[];
}

enum NavigationAidType {
  DIRECT_SIGHT = "direct_sight", // ship visible directly
  BEACON_SIGNAL = "beacon_signal", // electronic beacon
  SMOKE_COLUMN = "smoke_column", // visible marker
  COMPASS = "compass", // directional indicator
  BREADCRUMBS = "breadcrumbs", // path markers
  LANDMARK = "landmark", // using environmental features
}

interface PlayerTrail {
  readonly points: TrailPoint[];
  readonly maxLength: number; // maximum trail length
  readonly fadeTime: number; // how long trail points last
  readonly visibility: TrailVisibility;
}

interface TrailPoint {
  readonly position: Point;
  readonly timestamp: number;
  readonly activity: PlayerActivity; // what player was doing
  readonly terrainType: TerrainType;
  readonly notable: boolean; // significant location
}

enum TrailVisibility {
  ALWAYS = "always", // always visible trail
  CONDITIONAL = "conditional", // visible based on skill/tools
  HIDDEN = "hidden", // no visible trail
  DESTRUCTIBLE = "destructible", // can be erased by weather/creatures
}
```

### Ship Systems Access

```typescript
interface ShipSystem {
  readonly id: ShipSystemId;
  readonly name: string;
  readonly type: ShipSystemType;
  readonly accessRange: number; // distance at which system can be accessed
  readonly requiresProximity: boolean;
  readonly functionality: SystemFunctionality;
}

enum ShipSystemType {
  STORAGE = "storage", // expanded inventory
  FABRICATOR = "fabricator", // advanced crafting station
  MEDICAL_BAY = "medical_bay", // healing and treatment
  SCANNER = "scanner", // analyze collected samples
  COMMUNICATIONS = "communications", // contact other ships/bases
  POWER_SYSTEM = "power_system", // recharge equipment
  LIFE_SUPPORT = "life_support", // safe environment
  NAVIGATION_COMPUTER = "navigation_computer", // planetary mapping
}

interface SystemFunctionality {
  readonly available: boolean;
  readonly powerLevel: number; // 0-1, affects functionality
  readonly maintenanceRequired: boolean;
  readonly upgrades: SystemUpgrade[];
}
```

## System Architecture

### Domain Layer (`src/domain/game/ship/`)

```
ship/
├── ShipLocation.ts             # Ship positioning and status
├── NavigationSystem.ts         # Finding way back to ship
├── LandingSiteSelection.ts     # Choosing where to land
├── ShipSecurity.ts            # Protecting ship from threats
├── ShipSystemsAccess.ts       # Accessing ship functionality
├── BeaconSystem.ts            # Navigation beacon management
├── TrailSystem.ts             # Player path tracking
└── services/
    ├── ShipLocationService.ts  # Ship location management
    ├── NavigationService.ts    # Navigation aid provision
    └── ShipAccessService.ts    # Ship system access control
```

### Rendering Layer (`src/domain/render/ship/`)

```
ship/
├── ShipRenderer.ts            # Rendering landed ship
├── BeaconRenderer.ts          # Navigation beacon effects
├── TrailRenderer.ts           # Player trail visualization
├── CompassRenderer.ts         # Direction indicators
└── ShipSystemsUI.ts          # Ship interface when nearby
```

### Integration Layer (`src/domain/integration/`)

```
integration/
├── ShipPlanetBridge.ts        # Ship interaction with planet systems
├── ShipInventoryBridge.ts     # Ship storage access
├── ShipCraftingBridge.ts      # Ship-based crafting systems
└── ShipNavigationBridge.ts    # Integration with exploration
```

## Implementation Details

### Landing Site Selection

```typescript
class LandingSiteSelector {
  selectLandingSite(planet: Planet, requestedPosition: Point): LandingSite {
    // Start with requested position and find best nearby site
    const candidates = this.generateCandidateSites(requestedPosition, planet);

    // Score each candidate site
    const scoredSites = candidates.map((site) => ({
      site,
      score: this.scoreLandingSite(site, planet),
    }));

    // Select best site
    const bestSite = scoredSites.reduce((best, current) =>
      current.score > best.score ? current : best,
    ).site;

    return bestSite;
  }

  private scoreLandingSite(site: Point, planet: Planet): number {
    let score = 100; // baseline score

    // Terrain suitability
    const terrain = planet.getTerrainAt(site);
    switch (terrain.type) {
      case TerrainType.GRASS:
      case TerrainType.ROCK:
        score += 20; // ideal terrain
        break;
      case TerrainType.SAND:
      case TerrainType.DIRT:
        score += 10; // good terrain
        break;
      case TerrainType.SWAMP:
      case TerrainType.SNOW:
        score -= 10; // poor terrain
        break;
      case TerrainType.WATER:
      case TerrainType.LAVA:
        score -= 50; // dangerous terrain
        break;
    }

    // Slope evaluation (flatter is better)
    const slope = this.calculateSlope(site, planet);
    score -= slope * 30; // penalize steep slopes

    // Clear space around landing site
    const clearance = this.calculateClearance(site, planet);
    score += clearance * 20; // bonus for open space

    // Hazard assessment
    const hazards = this.identifyHazards(site, planet);
    for (const hazard of hazards) {
      score -= this.getHazardPenalty(hazard);
    }

    // Resource proximity (slight bonus for being near resources)
    const nearbyResources = this.getNearbyResources(site, planet);
    score += Math.min(10, nearbyResources.length * 2);

    // Landmark visibility (bonus for memorable location)
    const landmarks = this.getNearbyLandmarks(site, planet);
    score += Math.min(15, landmarks.length * 3);

    return Math.max(0, score);
  }

  private calculateClearance(position: Point, planet: Planet): number {
    const shipRadius = 10; // ship needs 10 units radius
    let clearanceRadius = 0;

    for (let radius = shipRadius; radius <= 50; radius += 2) {
      if (this.isAreaClear(position, radius, planet)) {
        clearanceRadius = radius;
      } else {
        break; // stop at first obstruction
      }
    }

    return Math.min(1.0, clearanceRadius / 50); // normalize to 0-1
  }
}
```

### Navigation Beacon System

```typescript
class NavigationBeacon {
  private ship: ShipLocation;
  private activeSignals: NavigationSignal[] = [];

  constructor(ship: ShipLocation) {
    this.ship = ship;
    this.initializeBeaconSystems();
  }

  getNavigationAid(playerPosition: Point): NavigationAid {
    const distance = Vector.distance(playerPosition, this.ship.position);
    const direction = Vector.fromTo(playerPosition, this.ship.position).normalize();

    // Determine primary navigation aid based on distance and conditions
    if (distance < 100 && this.hasDirectLineOfSight(playerPosition)) {
      return {
        type: NavigationAidType.DIRECT_SIGHT,
        direction,
        distance,
        visibility: true,
        estimatedTime: this.calculateTravelTime(distance),
        obstacles: [],
      };
    }

    if (distance < this.ship.navigationBeacon.range) {
      return {
        type: NavigationAidType.BEACON_SIGNAL,
        direction,
        distance,
        visibility: false,
        estimatedTime: this.calculateTravelTime(distance),
        obstacles: this.identifyObstacles(playerPosition, this.ship.position),
      };
    }

    // Fallback to compass direction
    return {
      type: NavigationAidType.COMPASS,
      direction,
      distance,
      visibility: false,
      estimatedTime: this.calculateTravelTime(distance),
      obstacles: [],
    };
  }

  private hasDirectLineOfSight(playerPosition: Point): boolean {
    const raycast = new Raycast(playerPosition, this.ship.position);
    const obstacles = raycast.findObstructions();

    // Check if any obstacles block view of ship
    for (const obstacle of obstacles) {
      if (obstacle.height > 5 && obstacle.opacity > 0.8) {
        return false; // tall, opaque obstacle blocks view
      }
    }

    return true;
  }

  updateBeaconSignalStrength(weather: WeatherCondition): void {
    let signalStrength = 1.0;

    // Weather affects beacon visibility
    switch (weather.type) {
      case WeatherType.CLEAR:
        signalStrength = 1.0;
        break;
      case WeatherType.RAIN:
        signalStrength = 0.8;
        break;
      case WeatherType.FOG:
        signalStrength = 0.4;
        break;
      case WeatherType.STORM:
        signalStrength = 0.2;
        break;
    }

    // Terrain affects signal propagation
    const terrainPenalty = this.calculateTerrainSignalPenalty();
    signalStrength *= terrainPenalty;

    this.ship.navigationBeacon.signalStrength = signalStrength;
  }
}
```

### Player Trail System

```typescript
class PlayerTrailSystem {
  private trail: PlayerTrail;
  private lastRecordedPosition: Point | null = null;
  private recordingInterval = 5000; // record position every 5 seconds

  constructor() {
    this.trail = {
      points: [],
      maxLength: 500, // keep last 500 trail points
      fadeTime: 3600000, // 1 hour in milliseconds
      visibility: TrailVisibility.CONDITIONAL,
    };
  }

  updatePlayerPosition(position: Point, activity: PlayerActivity): void {
    const now = Date.now();

    // Only record if player has moved significantly or enough time has passed
    if (this.shouldRecordPoint(position, now)) {
      const trailPoint: TrailPoint = {
        position,
        timestamp: now,
        activity,
        terrainType: this.getTerrainType(position),
        notable: this.isNotableLocation(position, activity),
      };

      this.trail.points.push(trailPoint);
      this.lastRecordedPosition = position;

      // Trim old trail points
      this.trimTrail();
    }
  }

  private shouldRecordPoint(position: Point, timestamp: number): boolean {
    if (!this.lastRecordedPosition) return true;

    const distance = Vector.distance(position, this.lastRecordedPosition);
    const timeSince = timestamp - (this.trail.points[this.trail.points.length - 1]?.timestamp || 0);

    // Record if moved far enough or enough time passed
    return distance > 20 || timeSince > this.recordingInterval;
  }

  private isNotableLocation(position: Point, activity: PlayerActivity): boolean {
    // Mark significant activities as notable
    switch (activity.type) {
      case ActivityType.MINING:
      case ActivityType.TREE_CUTTING:
      case ActivityType.STRUCTURE_BUILDING:
      case ActivityType.RARE_RESOURCE_FOUND:
        return true;
      default:
        return false;
    }
  }

  getTrailBackToShip(currentPosition: Point, ship: ShipLocation): TrailPoint[] {
    // Find trail points that lead back toward ship
    const relevantPoints = this.trail.points.filter((point) => {
      const distanceToShip = Vector.distance(point.position, ship.position);
      const currentDistanceToShip = Vector.distance(currentPosition, ship.position);

      // Include points that are closer to ship than current position
      return distanceToShip < currentDistanceToShip;
    });

    // Sort by distance to ship (closest first)
    return relevantPoints.sort((a, b) => {
      const distanceA = Vector.distance(a.position, ship.position);
      const distanceB = Vector.distance(b.position, ship.position);
      return distanceA - distanceB;
    });
  }
}
```

### Ship Systems Access

```typescript
class ShipSystemsAccess {
  private ship: ShipLocation;
  private accessibleSystems: Map<ShipSystemType, ShipSystem> = new Map();

  updateSystemAccess(playerPosition: Point): void {
    const distanceToShip = Vector.distance(playerPosition, this.ship.position);

    // Update which systems are accessible based on distance
    for (const system of this.ship.accessibleSystems) {
      const accessible =
        distanceToShip <= system.accessRange &&
        system.functionality.available &&
        !system.functionality.maintenanceRequired;

      if (accessible) {
        this.accessibleSystems.set(system.type, system);
      } else {
        this.accessibleSystems.delete(system.type);
      }
    }
  }

  accessSystem(systemType: ShipSystemType, player: Player): SystemAccessResult {
    const system = this.accessibleSystems.get(systemType);
    if (!system) {
      return {
        success: false,
        reason: "System not accessible from current position",
      };
    }

    switch (systemType) {
      case ShipSystemType.STORAGE:
        return this.accessShipStorage(player);
      case ShipSystemType.FABRICATOR:
        return this.accessFabricator(player);
      case ShipSystemType.MEDICAL_BAY:
        return this.accessMedicalBay(player);
      case ShipSystemType.SCANNER:
        return this.accessScanner(player);
      default:
        return { success: false, reason: "Unknown system type" };
    }
  }

  private accessShipStorage(player: Player): SystemAccessResult {
    // Ship storage acts as expanded inventory
    const shipStorage = this.ship.systems.get(ShipSystemType.STORAGE);

    return {
      success: true,
      interface: new ShipStorageInterface(shipStorage, player.inventory),
    };
  }

  private accessFabricator(player: Player): SystemAccessResult {
    // Advanced crafting station with ship power
    const fabricator = this.ship.systems.get(ShipSystemType.FABRICATOR);

    if (fabricator.functionality.powerLevel < 0.3) {
      return {
        success: false,
        reason: "Insufficient power for fabricator operation",
      };
    }

    return {
      success: true,
      interface: new FabricatorInterface(fabricator, player.inventory),
    };
  }
}
```

### Ship Security System

```typescript
class ShipSecuritySystem {
  private ship: ShipLocation;
  private threats: EnvironmentalThreat[] = [];
  private lastSecurityScan = 0;

  updateSecurity(dt: number): void {
    const now = Date.now();

    // Perform security scan every 30 seconds
    if (now - this.lastSecurityScan > 30000) {
      this.performSecurityScan();
      this.lastSecurityScan = now;
    }

    // Update existing threats
    this.updateThreats(dt);

    // Update ship security status
    this.updateSecurityStatus();
  }

  private performSecurityScan(): void {
    this.threats = [];

    // Scan for creature threats
    const nearbyCreatures = this.findNearbyCreatures(this.ship.position, 100);
    for (const creature of nearbyCreatures) {
      if (creature.isHostile() && creature.canDamageShip()) {
        this.threats.push({
          type: ThreatType.HOSTILE_CREATURE,
          source: creature,
          severity: this.calculateThreatSeverity(creature),
          distance: Vector.distance(creature.position, this.ship.position),
        });
      }
    }

    // Scan for environmental hazards
    const hazards = this.identifyEnvironmentalHazards(this.ship.position, 50);
    for (const hazard of hazards) {
      this.threats.push({
        type: ThreatType.ENVIRONMENTAL_HAZARD,
        source: hazard,
        severity: hazard.severity,
        distance: Vector.distance(hazard.position, this.ship.position),
      });
    }

    // Check weather threats
    const weather = this.getCurrentWeather();
    if (this.isWeatherThreatening(weather)) {
      this.threats.push({
        type: ThreatType.WEATHER,
        source: weather,
        severity: this.getWeatherThreatLevel(weather),
        distance: 0, // weather affects entire area
      });
    }
  }

  private updateSecurityStatus(): void {
    if (this.threats.length === 0) {
      this.ship.securityStatus = ShipSecurityStatus.SECURE;
      return;
    }

    const maxThreatLevel = Math.max(...this.threats.map((t) => t.severity));

    if (maxThreatLevel < 0.3) {
      this.ship.securityStatus = ShipSecurityStatus.MONITORED;
    } else if (maxThreatLevel < 0.7) {
      this.ship.securityStatus = ShipSecurityStatus.THREATENED;
    } else {
      // High threat level - ship may take damage
      this.ship.securityStatus = ShipSecurityStatus.THREATENED;
      this.handleShipThreat();
    }
  }

  private handleShipThreat(): void {
    for (const threat of this.threats) {
      if (threat.severity > 0.7) {
        // Apply damage to ship systems
        this.damageShipSystems(threat);

        // Generate alert for player
        this.generateSecurityAlert(threat);
      }
    }
  }
}
```

## Integration Points

### With Planet Mode

```typescript
interface ShipPlanetIntegration {
  onPlanetLanding(planet: Planet, landingPosition: Point): ShipLocation;
  onPlanetDeparture(ship: ShipLocation): void;
  getNavigationAid(playerPosition: Point): NavigationAid;
  canAccessShipSystems(playerPosition: Point): boolean;
}

class ShipPlanetBridge implements ShipPlanetIntegration {
  onPlanetLanding(planet: Planet, landingPosition: Point): ShipLocation {
    const landingSite = this.landingSiteSelector.selectLandingSite(planet, landingPosition);
    const ship = this.createShipLocation(planet, landingSite);

    // Initialize ship systems based on ship configuration
    this.initializeShipSystems(ship);

    // Start security monitoring
    this.securitySystem.startMonitoring(ship);

    // Initialize navigation beacon
    this.beaconSystem.activateBeacon(ship);

    return ship;
  }

  getNavigationAid(playerPosition: Point): NavigationAid {
    const ship = this.getCurrentShipLocation();
    if (!ship) return null;

    return this.navigationBeacon.getNavigationAid(playerPosition);
  }
}
```

### With Space Mode Transition

```typescript
class ModeTransitionIntegration {
  handleTakeoff(player: Player, ship: ShipLocation): ModeTransitionData {
    // Verify player is at ship location
    const distance = Vector.distance(player.position, ship.position);
    if (distance > ship.accessRange) {
      throw new Error("Player must be near ship to take off");
    }

    // Prepare transition data
    const transitionData: ModeTransitionData = {
      sourceMode: "planet",
      targetMode: "space",
      playerData: {
        position: ship.position, // player position becomes ship position
        inventory: player.inventory,
        skills: player.skills,
      },
      shipData: {
        condition: this.assessShipCondition(ship),
        fuel: ship.fuel,
        cargo: ship.storage,
        upgrades: ship.upgrades,
      },
    };

    // Cleanup planet-side ship systems
    this.cleanupShipLocation(ship);

    return transitionData;
  }
}
```

## Performance Considerations

### Beacon Optimization

```typescript
class BeaconOptimization {
  private lastBeaconUpdate = 0;
  private cachedNavigationAid: NavigationAid | null = null;

  getOptimizedNavigationAid(playerPosition: Point): NavigationAid {
    const now = Date.now();

    // Only update navigation aid every 100ms to reduce computation
    if (now - this.lastBeaconUpdate < 100 && this.cachedNavigationAid) {
      return this.cachedNavigationAid;
    }

    this.cachedNavigationAid = this.beacon.getNavigationAid(playerPosition);
    this.lastBeaconUpdate = now;

    return this.cachedNavigationAid;
  }
}
```

### Trail Memory Management

```typescript
class TrailMemoryManager {
  private maxTrailPoints = 500;

  trimTrail(): void {
    // Remove oldest points beyond limit
    if (this.trail.points.length > this.maxTrailPoints) {
      const excess = this.trail.points.length - this.maxTrailPoints;
      this.trail.points.splice(0, excess);
    }

    // Remove expired points
    const now = Date.now();
    this.trail.points = this.trail.points.filter(
      (point) => now - point.timestamp < this.trail.fadeTime,
    );
  }
}
```

## Testing Strategy

### Unit Tests

- **Landing Site Selection**: Test scoring algorithm selects appropriate sites
- **Navigation Aids**: Test navigation aid selection based on distance/conditions
- **Ship System Access**: Test system accessibility based on player proximity
- **Security System**: Test threat detection and response

### Integration Tests

- **Mode Transitions**: Test seamless transitions between space and planet modes
- **Ship Persistence**: Test ship location persists correctly across game sessions
- **Cross-System Integration**: Test ship systems work with inventory/crafting
- **Trail System**: Test player trail recording and retrieval

### Gameplay Tests

- **Navigation Experience**: Test players can reliably find their ship
- **Exploration Range**: Test ship location affects exploration patterns appropriately
- **Ship Security**: Test ship protection systems work under various conditions

## Success Metrics

- **Navigation Success**: 95%+ of players can find their ship within 2 minutes
- **Landing Quality**: 90%+ of landing sites score as "good" or better
- **System Accessibility**: Ship systems accessible within expected ranges
- **Performance**: Navigation aids update at 60fps with minimal CPU impact
- **Player Satisfaction**: Players feel confident exploring knowing they can return to ship
