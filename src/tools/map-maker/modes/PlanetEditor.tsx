import type { JSX } from "react";
import { useEffect, useState, useCallback } from "react";
import type { MapMakerEngine } from "../MapMakerEngine";
import type { PlanetSurfaceProject, LayerFeature } from "../types/MapProject";
import type { TerrainFeature } from "../../../domain/game/planet-surface/types";
import type { Point2D } from "../../../shared/types/geometry";
import type { Biome } from "../../../shared/types/Biome";
import { createId } from "../utils/id";

interface PlanetEditorProps {
  engine: MapMakerEngine;
  project: PlanetSurfaceProject;
  onProjectUpdate: (project: PlanetSurfaceProject) => void;
}

export function PlanetEditor({ engine, project, onProjectUpdate }: PlanetEditorProps): JSX.Element {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [currentBrushSize] = useState(32);
  const [currentBiome] = useState<Biome>("fields");

  // Add feature to project declared early to avoid TDZ
  const addTerrainFeatureToProject = useCallback(
    (feature: TerrainFeature): void => {
      const updatedProject: PlanetSurfaceProject = {
        ...project,
        terrain: [...project.terrain, feature],
        layers: {
          ...project.layers,
          terrain: {
            ...project.layers.terrain,
            features: [...project.layers.terrain.features, terrainFeatureToLayerFeature(feature)],
          },
        },
      };
      onProjectUpdate(updatedProject);
    },
    [project, onProjectUpdate],
  );

  const handleRockPlacement = useCallback(
    (position: Point2D): void => {
      const rock: TerrainFeature = {
        id: createId("rock"),
        x: position.x,
        y: position.y,
        type: "rock",
        size: 16, // Default size, could be configurable
      };
      addTerrainFeatureToProject(rock);
    },
    [addTerrainFeatureToProject],
  );

  const handleStructurePlacement = useCallback(
    (position: Point2D): void => {
      const structure: TerrainFeature = {
        id: createId("structure"),
        x: position.x,
        y: position.y,
        type: "structure",
        size: 32,
      };
      addTerrainFeatureToProject(structure);
    },
    [addTerrainFeatureToProject],
  );

  const handleVillagePlacement = useCallback(
    (position: Point2D): void => {
      // Villages are complex structures, for now create a cluster of structures
      const villageSize = 64;
      const buildings = [];

      for (let i = 0; i < 5; i++) {
        const offsetX = (Math.random() - 0.5) * villageSize;
        const offsetY = (Math.random() - 0.5) * villageSize;
        buildings.push({
          id: createId("building"),
          x: position.x + offsetX,
          y: position.y + offsetY,
          type: "structure" as const,
          size: 8 + Math.random() * 16,
        });
      }

      const updatedProject: PlanetSurfaceProject = {
        ...project,
        terrain: [...project.terrain, ...buildings],
        layers: {
          ...project.layers,
          terrain: {
            ...project.layers.terrain,
            features: [
              ...project.layers.terrain.features,
              ...buildings.map(terrainFeatureToLayerFeature),
            ],
          },
        },
      };
      onProjectUpdate(updatedProject);
    },
    [project, onProjectUpdate],
  );

  const handleTerrainBrush = useCallback(
    (position: Point2D, _toolId: string): void => {
      // For now, just place terrain markers where brush is applied
      // In a real implementation, this would modify a height map
      const terrainMarker: TerrainFeature = {
        id: createId("terrain"),
        x: position.x,
        y: position.y,
        type: "vegetation",
        size: currentBrushSize / 4,
      };
      addTerrainFeatureToProject(terrainMarker);
    },
    [currentBrushSize, addTerrainFeatureToProject],
  );

  const handleBiomePainting = useCallback(
    (position: Point2D): void => {
      // Update the project's biome
      // In a more complex implementation, this would support multiple biome areas
      const updatedProject: PlanetSurfaceProject = {
        ...project,
        biome: currentBiome,
        layers: {
          ...project.layers,
          biomes: {
            biome: currentBiome,
            paintedAreas: [
              ...project.layers.biomes.paintedAreas,
              {
                id: createId("biome"),
                points: [position], // Simplified - would be a brush area
                biome: currentBiome,
                opacity: 1.0,
              },
            ],
          },
        },
      };
      onProjectUpdate(updatedProject);
    },
    [project, onProjectUpdate, currentBiome],
  );

  const handleSelectionTool = useCallback(
    (position: Point2D): void => {
      // Find features near the click position
      const nearbyFeatures = findFeaturesNearPoint(position, project);
      if (nearbyFeatures.length > 0) {
        setSelectedFeatures([nearbyFeatures[0].id]);
      } else {
        setSelectedFeatures([]);
      }
    },
    [project],
  );

  // Resource management functionality would go here

  const findFeaturesNearPoint = (
    point: Point2D,
    currentProject: PlanetSurfaceProject,
  ): TerrainFeature[] => {
    const searchRadius = 20;
    return currentProject.terrain.filter((feature) => {
      const distance = Math.sqrt(
        Math.pow(point.x - feature.x, 2) + Math.pow(point.y - feature.y, 2),
      );
      return distance <= searchRadius;
    });
  };

  // Helper functions to convert domain objects to layer features
  const terrainFeatureToLayerFeature = (feature: TerrainFeature): LayerFeature => ({
    id: feature.id,
    x: feature.x,
    y: feature.y,
    type: feature.type,
    properties: {
      size: feature.size,
    },
  });

  // Mouse handlers (declared after helpers to avoid TDZ issues)
  const handleMouseMove = useCallback(
    (data: { worldPos: Point2D; isDrawing: boolean }): void => {
      const currentTool = engine.getCurrentTool();
      if (!currentTool || !data.isDrawing) return;
      const snappedPos = engine.snapToGrid(data.worldPos);
      if (currentTool.id === "hill" || currentTool.id === "terrain_height") {
        handleTerrainBrush(snappedPos, currentTool.id);
      } else if (currentTool.id === "biome") {
        handleBiomePainting(snappedPos);
      }
    },
    [engine, handleTerrainBrush, handleBiomePainting],
  );

  const handleMouseDown = useCallback(
    (data: { worldPos: Point2D; button: number }): void => {
      if (data.button !== 0) return; // Only handle left click
      const currentTool = engine.getCurrentTool();
      if (!currentTool) return;
      const snappedPos = engine.snapToGrid(data.worldPos);
      switch (currentTool.id) {
        case "rock":
          handleRockPlacement(snappedPos);
          break;
        case "structure":
          handleStructurePlacement(snappedPos);
          break;
        case "village":
          handleVillagePlacement(snappedPos);
          break;
        case "hill":
        case "terrain_height":
          handleTerrainBrush(snappedPos, currentTool.id);
          break;
        case "biome":
          handleBiomePainting(snappedPos);
          break;
        case "select":
          handleSelectionTool(snappedPos);
          break;
      }
    },
    [
      engine,
      handleRockPlacement,
      handleStructurePlacement,
      handleVillagePlacement,
      handleTerrainBrush,
      handleBiomePainting,
      handleSelectionTool,
    ],
  );

  // Set up event listeners
  useEffect(() => {
    engine.on("mouseDown", handleMouseDown);
    engine.on("mouseMove", handleMouseMove);
    return (): void => {
      engine.off("mouseDown", handleMouseDown);
      engine.off("mouseMove", handleMouseMove);
    };
  }, [engine, handleMouseDown, handleMouseMove]);

  // Resource conversion utilities would go here

  // IDs generated via utils/id

  // Update engine with selection state
  useEffect(() => {
    engine.emit("selectionUpdate", selectedFeatures);
  }, [selectedFeatures, engine]);

  // This component manages state but doesn't render anything directly
  return <></>;
}
