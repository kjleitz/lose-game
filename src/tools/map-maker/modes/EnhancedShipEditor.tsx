import type { JSX } from "react";
import { useEffect, useState, useCallback } from "react";
import type { MapMakerEngine } from "../MapMakerEngine";
import type { ShipInteriorProject, LayerFeature } from "../types/MapProject";
import type { Wall, Door, InteractiveStation } from "../../../domain/game/ship-interior/types";
import type { Point2D } from "../../../shared/types/geometry";
import { WallDrawingTool } from "../tools/WallDrawingTool";
import { SelectionTool, type SelectableFeature } from "../tools/SelectionTool";
import { DoorPlacementTool } from "../tools/DoorPlacementTool";
import { RoomDetector } from "../tools/RoomDetector";
import { createId } from "../utils/id";

interface EnhancedShipEditorProps {
  engine: MapMakerEngine;
  project: ShipInteriorProject;
  onProjectUpdate: (project: ShipInteriorProject) => void;
}

export function EnhancedShipEditor({
  engine,
  project,
  onProjectUpdate,
}: EnhancedShipEditorProps): JSX.Element {
  const [wallTool] = useState(() => new WallDrawingTool(engine));
  const [selectionTool] = useState(() => new SelectionTool());
  const [doorTool] = useState(() => new DoorPlacementTool());
  const [roomDetector] = useState(() => new RoomDetector());
  const [selectedFeatures, setSelectedFeatures] = useState<SelectableFeature[]>([]);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [multiSelectStart, setMultiSelectStart] = useState<Point2D | null>(null);

  const handleMouseMove = useCallback(
    (data: { worldPos: Point2D; isDrawing: boolean }) => {
      const currentTool = engine.getCurrentTool();
      if (!currentTool) return;

      const snappedPos = engine.snapToGrid(data.worldPos);

      if (currentTool.id === "wall" && wallTool.isDrawing()) {
        wallTool.updateDrawing(snappedPos);
        // Update the engine's tool preview with the current wall preview
        engine.setToolPreview(wallTool.getPreviewWall());
      }

      if (currentTool.id === "select" && isMultiSelecting && multiSelectStart) {
        // Multi-selection preview could be handled here
      }
    },
    [engine, wallTool, isMultiSelecting, multiSelectStart],
  );

  const createStation = useCallback(
    (position: Point2D): InteractiveStation => {
      const stationType = engine.getToolPropertyString("stationType");
      const radius = engine.getToolPropertyNumber("radius");
      const type: InteractiveStation["type"] =
        stationType === "pilot_console" ||
        stationType === "cargo_terminal" ||
        stationType === "engine_controls" ||
        stationType === "navigation" ||
        stationType === "life_support"
          ? stationType
          : "pilot_console";
      const radiusValue = radius != null ? radius : 24;
      return {
        id: createId("station"),
        x: position.x,
        y: position.y,
        type,
        name: "Console",
        radius: radiusValue,
        functionality: "ship_systems",
      };
    },
    [engine],
  );

  // Add/remove mutators declared before placement handlers to avoid TDZ
  const addDoorToProject = useCallback(
    (door: Door) => {
      const updatedProject: ShipInteriorProject = {
        ...project,
        doors: [...project.doors, door],
        layers: {
          ...project.layers,
          objects: {
            ...project.layers.objects,
            doors: [...project.layers.objects.doors, doorToLayerFeature(door)],
          },
        },
      };
      onProjectUpdate(updatedProject);
    },
    [project, onProjectUpdate],
  );

  const addStationToProject = useCallback(
    (station: InteractiveStation) => {
      const updatedProject: ShipInteriorProject = {
        ...project,
        stations: [...project.stations, station],
        layers: {
          ...project.layers,
          objects: {
            ...project.layers.objects,
            stations: [...project.layers.objects.stations, stationToLayerFeature(station)],
          },
        },
      };
      onProjectUpdate(updatedProject);
    },
    [project, onProjectUpdate],
  );

  const handleDoorPlacement = useCallback(
    (position: Point2D) => {
      if (!doorTool.canPlaceDoorAtPosition(position, project)) {
        return; // Could show user feedback here
      }

      const result = doorTool.placeDoorNearWalls(position, project);
      if (result) {
        const width = engine.getToolPropertyNumber("width");
        const doorType = engine.getToolPropertyString("doorType");
        const updated: Door = {
          ...result.door,
          width: width != null ? width : result.door.width,
          type:
            doorType === "sliding" || doorType === "manual" || doorType === "airlock"
              ? doorType
              : result.door.type,
        };
        addDoorToProject(updated);
      }
    },
    [doorTool, project, engine, addDoorToProject],
  );

  const handleStationPlacement = useCallback(
    (position: Point2D) => {
      const station = createStation(position);
      addStationToProject(station);
    },
    [createStation, addStationToProject],
  );

  const handleSelectionStart = useCallback(
    (position: Point2D) => {
      const feature = selectionTool.findFeatureAtPoint(position, project);

      if (feature) {
        const ls = project.layerState ?? {
          structure: { visible: true, locked: false, opacity: 1, order: 0 },
          objects: { visible: true, locked: false, opacity: 1, order: 1 },
          rooms: { visible: true, locked: false, opacity: 0.3, order: 2 },
          lighting: { visible: true, locked: false, opacity: 0.7, order: 3 },
        };
        if (
          (feature.type === "wall" && ls.structure.locked) ||
          ((feature.type === "door" || feature.type === "station") && ls.objects.locked)
        ) {
          // Do not select features from locked layers
          setSelectedFeatures([]);
          setIsMultiSelecting(false);
          return;
        }
        // Single selection
        setSelectedFeatures([feature]);
        setIsMultiSelecting(false);
      } else {
        // Start multi-selection
        setIsMultiSelecting(true);
        setMultiSelectStart(position);
        setSelectedFeatures([]);
      }
    },
    [selectionTool, project],
  );

  const handleSelectionEnd = useCallback(
    (position: Point2D) => {
      if (isMultiSelecting && multiSelectStart) {
        const selected = selectionTool.getMultipleSelection(multiSelectStart, position, project);
        setSelectedFeatures(selected);
        setIsMultiSelecting(false);
        setMultiSelectStart(null);
      }
    },
    [isMultiSelecting, multiSelectStart, selectionTool, project],
  );

  // Mirror selection into engine’s selection state for toolbar/clipboard
  useEffect(() => {
    engine.clearSelection();
    for (const selected of selectedFeatures) {
      engine.selectFeature(selected.id);
    }
  }, [selectedFeatures, engine]);

  // Room detection helpers come before wall mutation to avoid TDZ
  const calculateProjectBounds = (
    currentProject: ShipInteriorProject,
  ): { x: number; y: number; width: number; height: number } => {
    if (currentProject.walls.length === 0) {
      return { x: -200, y: -200, width: 400, height: 400 };
    }
    const allX = currentProject.walls.flatMap((wall) => [wall.x1, wall.x2]);
    const allY = currentProject.walls.flatMap((wall) => [wall.y1, wall.y2]);
    const minX = Math.min(...allX) - 50;
    const maxX = Math.max(...allX) + 50;
    const minY = Math.min(...allY) - 50;
    const maxY = Math.max(...allY) + 50;
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const detectAndUpdateRooms = useCallback(
    (currentProject: ShipInteriorProject) => {
      const bounds = calculateProjectBounds(currentProject);
      const detectedRooms = roomDetector.detectRooms(currentProject.walls, bounds);
      const shipRooms = roomDetector.convertDetectedRoomsToShipRooms(detectedRooms);
      roomDetector.updateRoomConnections(detectedRooms, currentProject.doors);
      const finalProject: ShipInteriorProject = {
        ...currentProject,
        rooms: shipRooms,
        layers: {
          ...currentProject.layers,
          rooms: {
            rooms: detectedRooms.map((room) => ({
              id: room.id,
              x: room.bounds.x + room.bounds.width / 2,
              y: room.bounds.y + room.bounds.height / 2,
              type: "room",
              properties: {
                bounds: room.bounds,
                enclosingWalls: room.enclosingWalls,
                detected: true,
              },
            })),
            autoDetected: true,
          },
        },
      };
      onProjectUpdate(finalProject);
    },
    [roomDetector, onProjectUpdate],
  );

  const addWallToProject = useCallback(
    (wall: Wall) => {
      const updatedProject: ShipInteriorProject = {
        ...project,
        walls: [...project.walls, wall],
        layers: {
          ...project.layers,
          structure: {
            ...project.layers.structure,
            walls: [...project.layers.structure.walls, wallToLayerFeature(wall)],
          },
        },
      };

      // Trigger room detection after wall changes
      detectAndUpdateRooms(updatedProject);
    },
    [project, detectAndUpdateRooms],
  );

  // Helper functions to convert domain objects to layer features
  const wallToLayerFeature = (wall: Wall): LayerFeature => ({
    id: wall.id,
    x: (wall.x1 + wall.x2) / 2,
    y: (wall.y1 + wall.y2) / 2,
    type: "wall",
    properties: {
      x1: wall.x1,
      y1: wall.y1,
      x2: wall.x2,
      y2: wall.y2,
      thickness: wall.thickness,
      wallType: wall.type,
    },
  });

  const doorToLayerFeature = (door: Door): LayerFeature => ({
    id: door.id,
    x: door.x,
    y: door.y,
    type: "door",
    properties: {
      width: door.width,
      height: door.height,
      orientation: door.orientation,
      doorType: door.type,
      isOpen: door.isOpen,
    },
  });

  const stationToLayerFeature = (station: InteractiveStation): LayerFeature => ({
    id: station.id,
    x: station.x,
    y: station.y,
    type: "station",
    properties: {
      stationType: station.type,
      name: station.name,
      radius: station.radius,
      functionality: station.functionality,
    },
  });

  // Mouse handlers (declared after helpers to avoid TDZ issues)
  const handleMouseDown = useCallback(
    (data: { worldPos: Point2D; button: number }) => {
      if (data.button !== 0) return; // Only handle left click
      const currentTool = engine.getCurrentTool();
      if (!currentTool) return;
      const snappedPos = engine.snapToGrid(data.worldPos);
      const ls = project.layerState ?? {
        structure: { visible: true, locked: false, opacity: 1, order: 0 },
        objects: { visible: true, locked: false, opacity: 1, order: 1 },
        rooms: { visible: true, locked: false, opacity: 0.3, order: 2 },
        lighting: { visible: true, locked: false, opacity: 0.7, order: 3 },
      };
      switch (currentTool.id) {
        case "wall":
          if (ls.structure.locked) return;
          wallTool.startDrawing(snappedPos);
          engine.setToolPreview(wallTool.getPreviewWall());
          break;
        case "door":
          if (ls.objects.locked) return;
          handleDoorPlacement(snappedPos);
          break;
        case "station":
          if (ls.objects.locked) return;
          handleStationPlacement(snappedPos);
          break;
        case "select":
          handleSelectionStart(snappedPos);
          break;
      }
    },
    [engine, wallTool, project, handleDoorPlacement, handleSelectionStart, handleStationPlacement],
  );

  const handleMouseUp = useCallback(
    (data: { worldPos: Point2D; button: number }) => {
      if (data.button !== 0) return;
      const currentTool = engine.getCurrentTool();
      if (!currentTool) return;
      const snappedPos = engine.snapToGrid(data.worldPos);
      switch (currentTool.id) {
        case "wall":
          if (wallTool.isDrawing()) {
            const newWall = wallTool.finishDrawing();
            if (newWall) {
              addWallToProject(newWall);
            }
            engine.setToolPreview(null);
          }
          break;
        case "select":
          handleSelectionEnd(snappedPos);
          break;
      }
    },
    [engine, wallTool, addWallToProject, handleSelectionEnd],
  );

  // Set up event listeners
  useEffect(() => {
    engine.on("mouseDown", handleMouseDown);
    engine.on("mouseMove", handleMouseMove);
    engine.on("mouseUp", handleMouseUp);
    return (): void => {
      engine.off("mouseDown", handleMouseDown);
      engine.off("mouseMove", handleMouseMove);
      engine.off("mouseUp", handleMouseUp);
    };
  }, [engine, handleMouseDown, handleMouseMove, handleMouseUp]);

  // Clean up wall preview when tool changes away from wall
  useEffect(() => {
    const handleToolChanged = (): void => {
      const tool = engine.getCurrentTool();
      if (!tool || tool.id !== "wall") {
        engine.setToolPreview(null);
      }
    };
    engine.on("toolChanged", handleToolChanged);
    return (): void => engine.off("toolChanged", handleToolChanged);
  }, [engine]);

  // Update engine with selection state (emit IDs only)
  useEffect(() => {
    const ids = selectedFeatures.map((feature) => feature.id);
    engine.emit("selectionUpdate", ids);
  }, [selectedFeatures, engine]);

  // This component manages state but doesn't render anything directly
  return <></>;
}
