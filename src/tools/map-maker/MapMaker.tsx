import type { JSX } from "react";
import { useState, useEffect, useMemo } from "react";
import { MapMakerEngine } from "./MapMakerEngine";
import { MapCanvas } from "./canvas/MapCanvas";
import { ToolPanel } from "./panels/ToolPanel";
import { PropertyPanel } from "./panels/PropertyPanel";
import { LayerPanel } from "./panels/LayerPanel";
import { EnhancedShipEditor } from "./modes/EnhancedShipEditor";
import { PlanetEditor } from "./modes/PlanetEditor";
import type { MapProject } from "./types/MapProject";
import type { EditingTool } from "./types/EditingTools";
import { getToolsForMode } from "./types/EditingTools";

interface MapMakerProps {
  initialProject?: MapProject;
  onProjectChange?: (project: MapProject) => void;
  className?: string;
}

export function MapMaker({
  initialProject,
  onProjectChange,
  className,
}: MapMakerProps): JSX.Element {
  const [engine] = useState(
    () =>
      new MapMakerEngine({
        canvasWidth: 800,
        canvasHeight: 600,
        gridSize: 16,
        snapToGrid: true,
        mode: "ship",
      }),
  );

  const [project, setProject] = useState<MapProject | null>(initialProject ?? null);
  const [currentTool, setCurrentTool] = useState<EditingTool | null>(null);
  const [toolProperties, setToolProperties] = useState<Record<string, unknown>>({});
  const [mode, setMode] = useState<"ship" | "planet">("ship");
  const [_selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Initialize default project if none provided
  useEffect(() => {
    if (!project) {
      const defaultProject: MapProject = {
        version: "1.0.0",
        type: "ship",
        metadata: {
          name: "New Ship",
          author: "Map Maker",
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        ship: {
          shipId: "ship-" + Date.now(),
          playerSpawnPoint: { x: 0, y: 0 },
          rooms: [],
          walls: [],
          doors: [],
          stations: [],
          layers: {
            structure: { walls: [], hull: [] },
            rooms: { rooms: [], autoDetected: true },
            objects: { doors: [], stations: [], furniture: [] },
            lighting: { lights: [], ambientLevel: 0.5 },
          },
          layerState: {
            structure: { visible: true, locked: false, opacity: 1, order: 0 },
            objects: { visible: true, locked: false, opacity: 1, order: 1 },
            rooms: { visible: true, locked: false, opacity: 0.3, order: 2 },
            lighting: { visible: true, locked: false, opacity: 0.7, order: 3 },
          },
        },
      };
      setProject(defaultProject);
      engine.setProject(defaultProject);
    }
  }, [project, engine]);

  // Set up engine event listeners
  useEffect(() => {
    const handleToolChange = (tool: EditingTool): void => {
      setCurrentTool(tool);
      // Sync UI properties from engine's current tool store
      setToolProperties(engine.getCurrentToolProperties());
    };

    const handleModeChange = (newMode: "ship" | "planet"): void => {
      setMode(newMode);
      setCurrentTool(null);
      setToolProperties({});
    };

    const handleSelectionChange = (features: string[]): void => {
      setSelectedFeatures(features);
    };

    const handleToolPropsChanged = (data: {
      toolId: string;
      properties: Record<string, unknown>;
    }): void => {
      setToolProperties(data.properties);
    };

    engine.on("toolChanged", handleToolChange);
    engine.on("modeChanged", handleModeChange);
    engine.on("selectionChanged", handleSelectionChange);
    engine.on("toolPropertiesChanged", handleToolPropsChanged);

    return (): void => {
      engine.off("toolChanged", handleToolChange);
      engine.off("modeChanged", handleModeChange);
      engine.off("selectionChanged", handleSelectionChange);
      engine.off("toolPropertiesChanged", handleToolPropsChanged);
    };
  }, [engine]);

  // Subscribe to history changes for Undo/Redo button state
  useEffect(() => {
    const handleHistoryChange = (data: { canUndo: boolean; canRedo: boolean }): void => {
      setCanUndo(data.canUndo);
      setCanRedo(data.canRedo);
    };

    // initialize on mount
    setCanUndo(engine.canUndo());
    setCanRedo(engine.canRedo());

    engine.on("historyChanged", handleHistoryChange);
    return (): void => engine.off("historyChanged", handleHistoryChange);
  }, [engine]);

  const availableTools = useMemo(() => getToolsForMode(mode), [mode]);

  const handleToolSelect = (toolId: string): void => {
    engine.setTool(toolId);
  };

  const handleToolPropertyChange = (propertyId: string, value: unknown): void => {
    setToolProperties((prev) => ({
      ...prev,
      [propertyId]: value,
    }));
    engine.setToolProperty(propertyId, value);
  };

  const handleModeToggle = (): void => {
    const newMode = mode === "ship" ? "planet" : "ship";

    // Create appropriate default project for the new mode
    if (newMode === "planet" && (!project || project.type !== "planet")) {
      const defaultPlanetProject: MapProject = {
        version: "1.0.0",
        type: "planet",
        metadata: {
          name: "New Planet",
          author: "Map Maker",
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        planet: {
          planetId: "planet-" + Date.now(),
          landingSite: { x: 0, y: 0 },
          terrain: [],
          resources: [],
          creatures: [],
          biome: "fields",
          layers: {
            terrain: { heightMap: undefined, features: [] },
            biomes: { biome: "fields", paintedAreas: [] },
            resources: { deposits: [] },
            decorations: { decorations: [] },
          },
          layerState: {
            terrain: { visible: true, locked: false, opacity: 1, order: 0 },
            biomes: { visible: true, locked: false, opacity: 0.7, order: 1 },
            resources: { visible: true, locked: false, opacity: 1, order: 2 },
            decorations: { visible: true, locked: false, opacity: 0.8, order: 3 },
          },
        },
      };
      setProject(defaultPlanetProject);
      engine.setProject(defaultPlanetProject);
    } else if (newMode === "ship" && (!project || project.type !== "ship")) {
      const defaultShipProject: MapProject = {
        version: "1.0.0",
        type: "ship",
        metadata: {
          name: "New Ship",
          author: "Map Maker",
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        ship: {
          shipId: "ship-" + Date.now(),
          playerSpawnPoint: { x: 0, y: 0 },
          rooms: [],
          walls: [],
          doors: [],
          stations: [],
          layers: {
            structure: { walls: [], hull: [] },
            rooms: { rooms: [], autoDetected: true },
            objects: { doors: [], stations: [], furniture: [] },
            lighting: { lights: [], ambientLevel: 0.5 },
          },
          layerState: {
            structure: { visible: true, locked: false, opacity: 1, order: 0 },
            objects: { visible: true, locked: false, opacity: 1, order: 1 },
            rooms: { visible: true, locked: false, opacity: 0.3, order: 2 },
            lighting: { visible: true, locked: false, opacity: 0.7, order: 3 },
          },
        },
      };
      setProject(defaultShipProject);
      engine.setProject(defaultShipProject);
    }

    engine.setMode(newMode);
  };

  const handleProjectUpdate = (updatedProject: MapProject): void => {
    setProject(updatedProject);
    engine.setProject(updatedProject);
    onProjectChange?.(updatedProject);
  };

  const handleSaveProject = (): void => {
    if (project) {
      const updatedProject = {
        ...project,
        metadata: {
          ...project.metadata,
          modified: new Date().toISOString(),
        },
      };
      handleProjectUpdate(updatedProject);

      // Save to localStorage
      const projectKey = `map-maker-${project.metadata.name}`;
      localStorage.setItem(projectKey, JSON.stringify(updatedProject));

      // TODO: Show success notification
      console.log("Project saved to localStorage");
    }
  };

  const handleExportProject = (): void => {
    if (project) {
      const dataStr = JSON.stringify(project);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `${project.metadata.name}.losemap.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleUndo = (): void => {
    engine.undo();
  };

  const handleRedo = (): void => {
    engine.redo();
  };

  const handleCopy = (): void => {
    engine.copySelectedFeatures();
  };

  const handlePaste = (): void => {
    engine.pasteFromClipboard();
  };

  // Layer management
  const layers = useMemo((): Array<{
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    opacity: number;
  }> => {
    if (!project) return [];

    if (project.type === "ship" && project.ship) {
      const state = project.ship.layerState ?? {
        structure: { visible: true, locked: false, opacity: 1, order: 0 },
        objects: { visible: true, locked: false, opacity: 1, order: 1 },
        rooms: { visible: true, locked: false, opacity: 0.3, order: 2 },
        lighting: { visible: true, locked: false, opacity: 0.7, order: 3 },
      };
      const entries: Array<{
        id: string;
        name: string;
        visible: boolean;
        locked: boolean;
        opacity: number;
        order: number;
      }> = [
        {
          id: "structure",
          name: "Structure",
          visible: state.structure.visible,
          locked: state.structure.locked,
          opacity: state.structure.opacity,
          order: state.structure.order,
        },
        {
          id: "objects",
          name: "Objects",
          visible: state.objects.visible,
          locked: state.objects.locked,
          opacity: state.objects.opacity,
          order: state.objects.order,
        },
        {
          id: "rooms",
          name: "Rooms",
          visible: state.rooms.visible,
          locked: state.rooms.locked,
          opacity: state.rooms.opacity,
          order: state.rooms.order,
        },
        {
          id: "lighting",
          name: "Lighting",
          visible: state.lighting.visible,
          locked: state.lighting.locked,
          opacity: state.lighting.opacity,
          order: state.lighting.order,
        },
      ];
      const sorted = entries.sort((left, right) => left.order - right.order);
      return sorted.map((item) => ({
        id: item.id,
        name: item.name,
        visible: item.visible,
        locked: item.locked,
        opacity: item.opacity,
      }));
    }

    if (project.type === "planet" && project.planet) {
      const state = project.planet.layerState ?? {
        terrain: { visible: true, locked: false, opacity: 1, order: 0 },
        biomes: { visible: true, locked: false, opacity: 0.7, order: 1 },
        resources: { visible: true, locked: false, opacity: 1, order: 2 },
        decorations: { visible: true, locked: false, opacity: 0.8, order: 3 },
      };
      const entries: Array<{
        id: string;
        name: string;
        visible: boolean;
        locked: boolean;
        opacity: number;
        order: number;
      }> = [
        {
          id: "terrain",
          name: "Terrain",
          visible: state.terrain.visible,
          locked: state.terrain.locked,
          opacity: state.terrain.opacity,
          order: state.terrain.order,
        },
        {
          id: "biomes",
          name: "Biomes",
          visible: state.biomes.visible,
          locked: state.biomes.locked,
          opacity: state.biomes.opacity,
          order: state.biomes.order,
        },
        {
          id: "resources",
          name: "Resources",
          visible: state.resources.visible,
          locked: state.resources.locked,
          opacity: state.resources.opacity,
          order: state.resources.order,
        },
        {
          id: "decorations",
          name: "Decorations",
          visible: state.decorations.visible,
          locked: state.decorations.locked,
          opacity: state.decorations.opacity,
          order: state.decorations.order,
        },
      ];
      const sorted = entries.sort((left, right) => left.order - right.order);
      return sorted.map((item) => ({
        id: item.id,
        name: item.name,
        visible: item.visible,
        locked: item.locked,
        opacity: item.opacity,
      }));
    }

    return [];
  }, [project]);

  const handleLayerToggle = (layerId: string, property: "visible" | "locked"): void => {
    if (!project) return;
    if (project.type === "ship" && project.ship) {
      const ls = project.ship.layerState ?? {
        structure: { visible: true, locked: false, opacity: 1, order: 0 },
        objects: { visible: true, locked: false, opacity: 1, order: 1 },
        rooms: { visible: true, locked: false, opacity: 0.3, order: 2 },
        lighting: { visible: true, locked: false, opacity: 0.7, order: 3 },
      };
      const updated = {
        structure:
          layerId === "structure"
            ? { ...ls.structure, [property]: !ls.structure[property] }
            : ls.structure,
        objects:
          layerId === "objects" ? { ...ls.objects, [property]: !ls.objects[property] } : ls.objects,
        rooms: layerId === "rooms" ? { ...ls.rooms, [property]: !ls.rooms[property] } : ls.rooms,
        lighting:
          layerId === "lighting"
            ? { ...ls.lighting, [property]: !ls.lighting[property] }
            : ls.lighting,
      };
      handleProjectUpdate({ ...project, ship: { ...project.ship, layerState: updated } });
    } else if (project.type === "planet" && project.planet) {
      const ls = project.planet.layerState ?? {
        terrain: { visible: true, locked: false, opacity: 1, order: 0 },
        biomes: { visible: true, locked: false, opacity: 0.7, order: 1 },
        resources: { visible: true, locked: false, opacity: 1, order: 2 },
        decorations: { visible: true, locked: false, opacity: 0.8, order: 3 },
      };
      const updated = {
        terrain:
          layerId === "terrain" ? { ...ls.terrain, [property]: !ls.terrain[property] } : ls.terrain,
        biomes:
          layerId === "biomes" ? { ...ls.biomes, [property]: !ls.biomes[property] } : ls.biomes,
        resources:
          layerId === "resources"
            ? { ...ls.resources, [property]: !ls.resources[property] }
            : ls.resources,
        decorations:
          layerId === "decorations"
            ? { ...ls.decorations, [property]: !ls.decorations[property] }
            : ls.decorations,
      };
      handleProjectUpdate({ ...project, planet: { ...project.planet, layerState: updated } });
    }
  };

  const handleLayerOpacityChange = (layerId: string, opacity: number): void => {
    if (!project) return;
    const clamp = (value: number): number => Math.max(0, Math.min(1, value));
    if (project.type === "ship" && project.ship) {
      const ls = project.ship.layerState ?? {
        structure: { visible: true, locked: false, opacity: 1, order: 0 },
        objects: { visible: true, locked: false, opacity: 1, order: 1 },
        rooms: { visible: true, locked: false, opacity: 0.3, order: 2 },
        lighting: { visible: true, locked: false, opacity: 0.7, order: 3 },
      };
      const updated = {
        structure:
          layerId === "structure" ? { ...ls.structure, opacity: clamp(opacity) } : ls.structure,
        objects: layerId === "objects" ? { ...ls.objects, opacity: clamp(opacity) } : ls.objects,
        rooms: layerId === "rooms" ? { ...ls.rooms, opacity: clamp(opacity) } : ls.rooms,
        lighting:
          layerId === "lighting" ? { ...ls.lighting, opacity: clamp(opacity) } : ls.lighting,
      };
      handleProjectUpdate({ ...project, ship: { ...project.ship, layerState: updated } });
    } else if (project.type === "planet" && project.planet) {
      const ls = project.planet.layerState ?? {
        terrain: { visible: true, locked: false, opacity: 1, order: 0 },
        biomes: { visible: true, locked: false, opacity: 0.7, order: 1 },
        resources: { visible: true, locked: false, opacity: 1, order: 2 },
        decorations: { visible: true, locked: false, opacity: 0.8, order: 3 },
      };
      const updated = {
        terrain: layerId === "terrain" ? { ...ls.terrain, opacity: clamp(opacity) } : ls.terrain,
        biomes: layerId === "biomes" ? { ...ls.biomes, opacity: clamp(opacity) } : ls.biomes,
        resources:
          layerId === "resources" ? { ...ls.resources, opacity: clamp(opacity) } : ls.resources,
        decorations:
          layerId === "decorations"
            ? { ...ls.decorations, opacity: clamp(opacity) }
            : ls.decorations,
      };
      handleProjectUpdate({ ...project, planet: { ...project.planet, layerState: updated } });
    }
  };

  const handleLayerReorder = (layerId: string, direction: "up" | "down"): void => {
    if (!project) return;
    if (project.type === "ship" && project.ship) {
      const ls = project.ship.layerState ?? {
        structure: { visible: true, locked: false, opacity: 1, order: 0 },
        objects: { visible: true, locked: false, opacity: 1, order: 1 },
        rooms: { visible: true, locked: false, opacity: 0.3, order: 2 },
        lighting: { visible: true, locked: false, opacity: 0.7, order: 3 },
      };
      const keys: Array<keyof typeof ls> = ["structure", "objects", "rooms", "lighting"];
      const sorted = keys.sort((leftKey, rightKey) => ls[leftKey].order - ls[rightKey].order);
      const isShipLayerId = (id: string): id is keyof typeof ls =>
        id === "structure" || id === "objects" || id === "rooms" || id === "lighting";
      if (!isShipLayerId(layerId)) return;
      const idx = sorted.findIndex((k) => k === layerId);
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (idx < 0 || swapWith < 0 || swapWith >= sorted.length) return;
      const current = sorted[idx];
      const neighbor = sorted[swapWith];
      const updated = {
        structure: { ...ls.structure },
        objects: { ...ls.objects },
        rooms: { ...ls.rooms },
        lighting: { ...ls.lighting },
      };
      const orderCurrent = updated[current].order;
      updated[current] = { ...updated[current], order: updated[neighbor].order };
      updated[neighbor] = { ...updated[neighbor], order: orderCurrent };
      handleProjectUpdate({ ...project, ship: { ...project.ship, layerState: updated } });
    } else if (project.type === "planet" && project.planet) {
      const ls = project.planet.layerState ?? {
        terrain: { visible: true, locked: false, opacity: 1, order: 0 },
        biomes: { visible: true, locked: false, opacity: 0.7, order: 1 },
        resources: { visible: true, locked: false, opacity: 1, order: 2 },
        decorations: { visible: true, locked: false, opacity: 0.8, order: 3 },
      };
      const keys: Array<keyof typeof ls> = ["terrain", "biomes", "resources", "decorations"];
      const sorted = keys.sort((leftKey, rightKey) => ls[leftKey].order - ls[rightKey].order);
      const isPlanetLayerId = (id: string): id is keyof typeof ls =>
        id === "terrain" || id === "biomes" || id === "resources" || id === "decorations";
      if (!isPlanetLayerId(layerId)) return;
      const idx = sorted.findIndex((k) => k === layerId);
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (idx < 0 || swapWith < 0 || swapWith >= sorted.length) return;
      const current = sorted[idx];
      const neighbor = sorted[swapWith];
      const updated = {
        terrain: { ...ls.terrain },
        biomes: { ...ls.biomes },
        resources: { ...ls.resources },
        decorations: { ...ls.decorations },
      };
      const orderCurrent = updated[current].order;
      updated[current] = { ...updated[current], order: updated[neighbor].order };
      updated[neighbor] = { ...updated[neighbor], order: orderCurrent };
      handleProjectUpdate({ ...project, planet: { ...project.planet, layerState: updated } });
    }
  };

  return (
    <div className={`flex h-screen bg-gray-900 text-white ${className ?? ""}`}>
      {/* Left sidebar - Tools and Properties */}
      <div className="w-80 flex flex-col space-y-4 p-4 bg-gray-800 border-r border-gray-700 overflow-y-auto min-h-0">
        {/* Mode toggle */}
        <div className="hud-panel p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="hud-text text-sm font-medium">Mode</span>
            <button
              type="button"
              onClick={handleModeToggle}
              className="px-3 py-1 text-xs bg-amber-500 text-black rounded hover:bg-amber-400 transition-colors"
            >
              Switch to {mode === "ship" ? "Planet" : "Ship"}
            </button>
          </div>
          <span className="text-lg font-semibold capitalize">{mode} Editor</span>
        </div>

        {/* Tools */}
        <ToolPanel
          tools={availableTools}
          activeTool={currentTool}
          onToolSelect={handleToolSelect}
        />

        {/* Properties */}
        <PropertyPanel
          tool={currentTool}
          values={toolProperties}
          onChange={handleToolPropertyChange}
        />
      </div>

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col">
        {/* Top toolbar */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!canUndo}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!canRedo}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
            >
              Redo
            </button>
            <div className="border-l border-gray-600 h-6 mx-2"></div>
            <button
              type="button"
              onClick={handleCopy}
              disabled={_selectedFeatures.length === 0}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              title="Copy (Ctrl+C)"
            >
              Copy
            </button>
            <button
              type="button"
              onClick={handlePaste}
              disabled={!engine.hasClipboardContent()}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              title="Paste (Ctrl+V)"
            >
              Paste
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleSaveProject}
              className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded"
            >
              Save
            </button>
            <button
              type="button"
              onClick={handleExportProject}
              className="px-3 py-1 text-sm bg-green-600 hover:bg-green-500 rounded"
            >
              Export
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <MapCanvas
            engine={engine}
            width={800}
            height={600}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>

      {/* Right sidebar - Layers */}
      <div className="w-64 p-4 bg-gray-800 border-l border-gray-700 overflow-y-auto min-h-0">
        <LayerPanel
          layers={layers}
          onLayerToggle={handleLayerToggle}
          onLayerOpacityChange={handleLayerOpacityChange}
          onLayerReorder={handleLayerReorder}
        />
      </div>

      {/* Mode-specific editors */}
      {project != null && project.type === "ship" && project.ship != null && (
        <EnhancedShipEditor
          engine={engine}
          project={project.ship}
          onProjectUpdate={(shipProject) => {
            if (project != null) {
              handleProjectUpdate({
                ...project,
                ship: shipProject,
              });
            }
          }}
        />
      )}

      {/* Planet editor */}
      {project != null && project.type === "planet" && project.planet != null && (
        <PlanetEditor
          engine={engine}
          project={project.planet}
          onProjectUpdate={(planetProject) => {
            if (project != null) {
              handleProjectUpdate({
                ...project,
                planet: planetProject,
              });
            }
          }}
        />
      )}
    </div>
  );
}
