import type { Point2D } from "../../shared/types/geometry";
import type { MapProject, LayerFeature } from "./types/MapProject";
import type { EditingTool } from "./types/EditingTools";
import type { Wall, Door, InteractiveStation } from "../../domain/game/ship-interior/types";
import { getToolById, getToolsForMode } from "./types/EditingTools";

export interface MapMakerConfig {
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  snapToGrid: boolean;
  mode: "ship" | "planet";
}

export interface EditingState {
  currentTool: EditingTool | null;
  selectedFeatures: Set<string>;
  isDrawing: boolean;
  drawingStart: Point2D | null;
  hoveredFeature: string | null;
  camera: {
    x: number;
    y: number;
    zoom: number;
  };
  clipboard: ClipboardData | null;
  toolPreview: Wall | null;
}

export interface ClipboardData {
  features: LayerFeature[];
  mode: "ship" | "planet";
  timestamp: number;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

export interface EditingHistory {
  undoStack: EditingAction[];
  redoStack: EditingAction[];
  maxHistory: number;
}

export interface EditingAction {
  type: "add" | "remove" | "modify" | "move";
  layerType: string;
  features: LayerFeature[];
  originalFeatures?: LayerFeature[];
  timestamp: number;
}

export interface EngineEventMap {
  projectChanged: MapProject;
  toolChanged: EditingTool;
  modeChanged: "ship" | "planet";
  selectionChanged: string[];
  cameraChanged: { x: number; y: number; zoom: number };
  historyChanged: { canUndo: boolean; canRedo: boolean };
  mouseDown: { worldPos: Point2D; button: number };
  mouseMove: { worldPos: Point2D; isDrawing: boolean; drawingStart: Point2D | null };
  mouseUp: { worldPos: Point2D; button: number; drawingStart: Point2D | null };
  actionExecuted: EditingAction;
  actionUndone: EditingAction;
  selectionUpdate: string[];
  clipboardChanged: { hasContent: boolean; featureCount: number; mode: "ship" | "planet" };
  selectAll: Record<string, never>;
  toolPropertiesChanged: { toolId: string; properties: Record<string, unknown> };
}

export class MapMakerEngine {
  private config: MapMakerConfig;
  private state: EditingState;
  private history: EditingHistory;
  private project: MapProject | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private featureIndex: Map<string, LayerFeature> = new Map();
  private toolProperties: Record<string, Record<string, unknown>> = {};
  // Stable bound handlers for add/removeEventListener
  private onMouseDown = (event: MouseEvent): void => this.handleMouseDown(event);
  private onMouseMove = (event: MouseEvent): void => this.handleMouseMove(event);
  private onMouseUp = (event: MouseEvent): void => this.handleMouseUp(event);
  private onWheel = (event: WheelEvent): void => this.handleWheel(event);
  private onKeyDown = (event: KeyboardEvent): void => this.handleKeyDown(event);
  // Type-safe event listeners object
  private listeners: {
    [K in keyof EngineEventMap]: Array<(data: EngineEventMap[K]) => void>;
  } = {
    projectChanged: [],
    toolChanged: [],
    modeChanged: [],
    selectionChanged: [],
    cameraChanged: [],
    historyChanged: [],
    mouseDown: [],
    mouseMove: [],
    mouseUp: [],
    actionExecuted: [],
    actionUndone: [],
    selectionUpdate: [],
    clipboardChanged: [],
    selectAll: [],
    toolPropertiesChanged: [],
  };

  // Performance optimization: Render throttling
  private lastRenderTime = 0;
  private readonly renderThrottleMs = 16; // 60fps max

  // Viewport culling cache
  private viewportCache: {
    bounds: { x: number; y: number; width: number; height: number } | null;
    lastUpdate: number;
    cacheTimeout: number;
  } = {
    bounds: null,
    lastUpdate: 0,
    cacheTimeout: 100, // Cache for 100ms
  };

  constructor(config: MapMakerConfig) {
    this.config = config;
    this.state = {
      currentTool: null,
      selectedFeatures: new Set(),
      isDrawing: false,
      drawingStart: null,
      hoveredFeature: null,
      camera: { x: 0, y: 0, zoom: 1 },
      clipboard: null,
      toolPreview: null,
    };
    this.history = {
      undoStack: [],
      redoStack: [],
      maxHistory: 50,
    };
  }

  public setCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");

    if (!this.context) {
      throw new Error("Failed to get 2D context from canvas");
    }

    this.setupCanvasEvents();
  }

  public setProject(project: MapProject): void {
    this.project = project;
    this.config.mode = project.type;
    this.rebuildFeatureIndex();
    this.clearHistory();
    this.clearSelection();
    this.emit("projectChanged", project);
  }

  public getProject(): MapProject | null {
    return this.project;
  }

  public setTool(toolId: string): void {
    const tool = getToolById(toolId, this.config.mode);
    if (tool) {
      this.state.currentTool = tool;
      this.clearSelection();
      // Initialize tool properties if not present
      if (this.toolProperties[tool.id] == null) {
        const defaults: Record<string, unknown> = {};
        tool.properties.forEach((prop) => {
          defaults[prop.id] = prop.defaultValue;
        });
        this.toolProperties[tool.id] = defaults;
      }
      this.emit("toolChanged", tool);
      this.emit("toolPropertiesChanged", {
        toolId: tool.id,
        properties: this.getCurrentToolProperties(),
      });
    }
  }

  public getCurrentTool(): EditingTool | null {
    return this.state.currentTool;
  }

  public getCurrentToolPreview(): Wall | null {
    return this.state.toolPreview;
  }

  public setToolPreview(previewData: Wall | null): void {
    this.state.toolPreview = previewData;
  }

  public getCurrentToolProperties(): Record<string, unknown> {
    const toolId = this.state.currentTool?.id;
    if (toolId == null) return {};
    const props = this.toolProperties[toolId];
    if (props == null) return {};
    return { ...props };
  }

  public setToolProperty(propertyId: string, value: unknown): void {
    const toolId = this.state.currentTool?.id;
    if (toolId == null) return;
    const existing = this.toolProperties[toolId] ?? {};
    this.toolProperties[toolId] = { ...existing, [propertyId]: value };
    this.emit("toolPropertiesChanged", { toolId, properties: this.getCurrentToolProperties() });
  }

  public getToolPropertyNumber(propertyId: string): number | undefined {
    const toolId = this.state.currentTool?.id;
    if (toolId == null) return undefined;
    const value = this.toolProperties[toolId]?.[propertyId];
    return typeof value === "number" ? value : undefined;
  }

  public getToolPropertyString(propertyId: string): string | undefined {
    const toolId = this.state.currentTool?.id;
    if (toolId == null) return undefined;
    const value = this.toolProperties[toolId]?.[propertyId];
    return typeof value === "string" ? value : undefined;
  }

  public getToolPropertyBoolean(propertyId: string): boolean | undefined {
    const toolId = this.state.currentTool?.id;
    if (toolId == null) return undefined;
    const value = this.toolProperties[toolId]?.[propertyId];
    return typeof value === "boolean" ? value : undefined;
  }

  public getAvailableTools(): EditingTool[] {
    return getToolsForMode(this.config.mode);
  }

  public setMode(mode: "ship" | "planet"): void {
    if (this.config.mode !== mode) {
      this.config.mode = mode;
      this.config.gridSize = mode === "ship" ? 16 : 32;
      this.state.currentTool = null;
      this.clearSelection();
      this.emit("modeChanged", mode);
    }
  }

  public getMode(): "ship" | "planet" {
    return this.config.mode;
  }

  public screenToWorld(screenX: number, screenY: number): Point2D {
    const rect = this.canvas?.getBoundingClientRect();
    if (!rect) return { x: screenX, y: screenY };

    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;

    return {
      x: canvasX / this.state.camera.zoom + this.state.camera.x,
      y: canvasY / this.state.camera.zoom + this.state.camera.y,
    };
  }

  public worldToScreen(worldX: number, worldY: number): Point2D {
    return {
      x: (worldX - this.state.camera.x) * this.state.camera.zoom,
      y: (worldY - this.state.camera.y) * this.state.camera.zoom,
    };
  }

  public snapToGrid(point: Point2D): Point2D {
    if (!this.config.snapToGrid) return point;

    const gridSize = this.config.gridSize;
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize,
    };
  }

  public getCamera(): { x: number; y: number; zoom: number } {
    return { ...this.state.camera };
  }

  public setCamera(x: number, y: number, zoom: number): void {
    this.state.camera = { x, y, zoom: Math.max(0.1, Math.min(5, zoom)) };
    this.emit("cameraChanged", this.state.camera);
  }

  public panCamera(deltaX: number, deltaY: number): void {
    this.state.camera.x += deltaX / this.state.camera.zoom;
    this.state.camera.y += deltaY / this.state.camera.zoom;
    this.emit("cameraChanged", this.state.camera);
  }

  public zoomCamera(delta: number, centerX: number, centerY: number): void {
    const worldCenter = this.screenToWorld(centerX, centerY);
    const newZoom = Math.max(0.1, Math.min(5, this.state.camera.zoom * (1 + delta)));

    this.state.camera.zoom = newZoom;

    const newWorldCenter = this.screenToWorld(centerX, centerY);
    this.state.camera.x += worldCenter.x - newWorldCenter.x;
    this.state.camera.y += worldCenter.y - newWorldCenter.y;

    this.emit("cameraChanged", this.state.camera);
  }

  public addFeature(layerType: string, feature: LayerFeature): void {
    if (!this.project) return;

    const action: EditingAction = {
      type: "add",
      layerType,
      features: [feature],
      timestamp: Date.now(),
    };

    this.executeAction(action);
    this.pushToHistory(action);
  }

  public removeFeature(layerType: string, featureId: string): void {
    if (!this.project) return;

    const feature = this.getFeatureById(featureId);
    if (!feature) return;

    const action: EditingAction = {
      type: "remove",
      layerType,
      features: [feature],
      timestamp: Date.now(),
    };

    this.executeAction(action);
    this.pushToHistory(action);
  }

  public modifyFeature(
    layerType: string,
    featureId: string,
    newProperties: Partial<LayerFeature>,
  ): void {
    if (!this.project) return;

    const originalFeature = this.getFeatureById(featureId);
    if (!originalFeature) return;

    const modifiedFeature = { ...originalFeature, ...newProperties };

    const action: EditingAction = {
      type: "modify",
      layerType,
      features: [modifiedFeature],
      originalFeatures: [originalFeature],
      timestamp: Date.now(),
    };

    this.executeAction(action);
    this.pushToHistory(action);
  }

  public selectFeature(featureId: string): void {
    this.state.selectedFeatures.add(featureId);
    this.emit("selectionChanged", Array.from(this.state.selectedFeatures));
  }

  public deselectFeature(featureId: string): void {
    this.state.selectedFeatures.delete(featureId);
    this.emit("selectionChanged", Array.from(this.state.selectedFeatures));
  }

  public clearSelection(): void {
    this.state.selectedFeatures.clear();
    this.emit("selectionChanged", []);
  }

  public getSelectedFeatures(): string[] {
    return Array.from(this.state.selectedFeatures);
  }

  public undo(): void {
    const action = this.history.undoStack.pop();
    if (!action) return;

    this.undoAction(action);
    this.history.redoStack.push(action);
    this.emit("historyChanged", { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  public redo(): void {
    const action = this.history.redoStack.pop();
    if (!action) return;

    this.executeAction(action);
    this.history.undoStack.push(action);
    this.emit("historyChanged", { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  public canUndo(): boolean {
    return this.history.undoStack.length > 0;
  }

  public canRedo(): boolean {
    return this.history.redoStack.length > 0;
  }

  public copySelectedFeatures(): boolean {
    if (this.state.selectedFeatures.size === 0 || !this.project) {
      return false;
    }

    const features = this.getSelectedFeaturesAsLayerFeatures();
    if (features.length === 0) {
      return false;
    }

    // Calculate bounds of selected features
    const bounds = this.calculateFeaturesBounds(features);

    this.state.clipboard = {
      features,
      mode: this.config.mode,
      timestamp: Date.now(),
      bounds,
    };

    this.emit("clipboardChanged", {
      hasContent: true,
      featureCount: features.length,
      mode: this.config.mode,
    });

    return true;
  }

  public pasteFromClipboard(targetPosition?: Point2D): boolean {
    if (!this.state.clipboard || !this.project) {
      return false;
    }

    // Check if we're in the same mode as when copied
    if (this.state.clipboard.mode !== this.config.mode) {
      return false;
    }

    const pastePosition = targetPosition || {
      x: this.state.camera.x,
      y: this.state.camera.y,
    };

    // Calculate offset to move features to paste position
    const clipboardCenter = {
      x: (this.state.clipboard.bounds.minX + this.state.clipboard.bounds.maxX) / 2,
      y: (this.state.clipboard.bounds.minY + this.state.clipboard.bounds.maxY) / 2,
    };

    const offset = {
      x: pastePosition.x - clipboardCenter.x,
      y: pastePosition.y - clipboardCenter.y,
    };

    // Create new features with offset positions
    const pastedFeatures = this.state.clipboard.features.map((feature) => ({
      ...feature,
      id: this.generateNewId(feature.id),
      x: feature.x + offset.x,
      y: feature.y + offset.y,
    }));

    // Add pasted features to project
    const action: EditingAction = {
      type: "add",
      layerType: "paste",
      features: pastedFeatures,
      timestamp: Date.now(),
    };

    this.executeAction(action);
    this.pushToHistory(action);

    // Select the newly pasted features
    this.clearSelection();
    pastedFeatures.forEach((feature) => this.selectFeature(feature.id));

    return true;
  }

  public hasClipboardContent(): boolean {
    return this.state.clipboard != null && this.state.clipboard.features.length > 0;
  }

  public getClipboardInfo(): { featureCount: number; mode: "ship" | "planet" } | null {
    if (!this.state.clipboard) {
      return null;
    }

    return {
      featureCount: this.state.clipboard.features.length,
      mode: this.state.clipboard.mode,
    };
  }

  public clearClipboard(): void {
    this.state.clipboard = null;
    this.emit("clipboardChanged", { hasContent: false, featureCount: 0, mode: this.config.mode });
  }

  public deleteSelectedFeatures(): boolean {
    if (this.state.selectedFeatures.size === 0 || !this.project) {
      return false;
    }

    const features = this.getSelectedFeaturesAsLayerFeatures();
    if (features.length === 0) {
      return false;
    }

    const action: EditingAction = {
      type: "remove",
      layerType: "deletion",
      features,
      timestamp: Date.now(),
    };

    this.executeAction(action);
    this.pushToHistory(action);
    this.clearSelection();

    return true;
  }

  public selectAllFeatures(): void {
    if (!this.project) return;

    // This is a simplified implementation
    // In practice, you'd iterate through all layers and select all features
    // For now, just emit the event
    this.emit("selectAll", {});
  }

  public on<K extends keyof EngineEventMap>(
    event: K,
    listener: (data: EngineEventMap[K]) => void,
  ): void {
    this.listeners[event].push(listener);
  }

  public off<K extends keyof EngineEventMap>(
    event: K,
    listener: (data: EngineEventMap[K]) => void,
  ): void {
    const eventListeners = this.listeners[event];
    const index = eventListeners.indexOf(listener);
    if (index !== -1) {
      eventListeners.splice(index, 1);
    }
  }

  public emit<K extends keyof EngineEventMap>(event: K, data: EngineEventMap[K]): void {
    this.listeners[event].forEach((listener) => listener(data));
  }

  private setupCanvasEvents(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener("mousedown", this.onMouseDown);
    this.canvas.addEventListener("mousemove", this.onMouseMove);
    this.canvas.addEventListener("mouseup", this.onMouseUp);
    // wheel needs passive: false to allow preventDefault without warnings
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());

    // Set up keyboard shortcuts
    document.addEventListener("keydown", this.onKeyDown);
  }

  public updateCanvasSize(width: number, height: number): void {
    this.config.canvasWidth = width;
    this.config.canvasHeight = height;
  }

  private handleMouseDown(event: MouseEvent): void {
    const worldPos = this.screenToWorld(event.clientX, event.clientY);
    const snappedPos = this.snapToGrid(worldPos);

    this.state.isDrawing = true;
    this.state.drawingStart = snappedPos;

    this.emit("mouseDown", { worldPos: snappedPos, button: event.button });
  }

  private handleMouseMove(event: MouseEvent): void {
    const worldPos = this.screenToWorld(event.clientX, event.clientY);
    const snappedPos = this.snapToGrid(worldPos);

    this.emit("mouseMove", {
      worldPos: snappedPos,
      isDrawing: this.state.isDrawing,
      drawingStart: this.state.drawingStart,
    });
  }

  private handleMouseUp(event: MouseEvent): void {
    const worldPos = this.screenToWorld(event.clientX, event.clientY);
    const snappedPos = this.snapToGrid(worldPos);

    this.state.isDrawing = false;

    this.emit("mouseUp", {
      worldPos: snappedPos,
      button: event.button,
      drawingStart: this.state.drawingStart,
    });

    this.state.drawingStart = null;
  }

  private handleWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = -event.deltaY * 0.001;
    this.zoomCamera(delta, event.clientX, event.clientY);
  }

  private handleKeyDown(event: KeyboardEvent): void {
    // Only handle shortcuts when the map maker is active
    if (!this.canvas || document.activeElement !== this.canvas) {
      return;
    }

    const isCtrl = event.ctrlKey || event.metaKey; // Support both Ctrl and Cmd

    if (isCtrl && event.key === "c") {
      event.preventDefault();
      this.copySelectedFeatures();
    } else if (isCtrl && event.key === "v") {
      event.preventDefault();
      this.pasteFromClipboard();
    } else if (isCtrl && event.key === "z" && !event.shiftKey) {
      event.preventDefault();
      this.undo();
    } else if (isCtrl && (event.key === "y" || (event.key === "z" && event.shiftKey))) {
      event.preventDefault();
      this.redo();
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      this.deleteSelectedFeatures();
    } else if (isCtrl && event.key === "a") {
      event.preventDefault();
      this.selectAllFeatures();
    } else if (event.key === "Escape") {
      event.preventDefault();
      this.clearSelection();

      // Cancel any active drawing operations
      if (this.state.isDrawing) {
        this.state.isDrawing = false;
        this.state.drawingStart = null;
      }
    }
  }

  private executeAction(action: EditingAction): void {
    if (!this.project) return;
    switch (action.type) {
      case "add":
        this.applyAdd(action.features);
        break;
      case "remove":
        this.applyRemove(action.features.map((feature) => feature.id));
        break;
      case "modify":
        this.applyModify(action.features);
        break;
      case "move":
        this.applyModify(action.features);
        break;
    }
    this.rebuildFeatureIndex();
    this.emit("actionExecuted", action);
    this.emit("projectChanged", this.project);
  }

  private undoAction(action: EditingAction): void {
    if (!this.project) return;
    switch (action.type) {
      case "add":
        this.applyRemove(action.features.map((feature) => feature.id));
        break;
      case "remove":
        this.applyAdd(action.features);
        break;
      case "modify":
        if (action.originalFeatures) {
          this.applyModify(action.originalFeatures);
        }
        break;
      case "move":
        if (action.originalFeatures) {
          this.applyModify(action.originalFeatures);
        }
        break;
    }
    this.rebuildFeatureIndex();
    this.emit("actionUndone", action);
    this.emit("projectChanged", this.project);
  }

  private pushToHistory(action: EditingAction): void {
    this.history.undoStack.push(action);
    this.history.redoStack = []; // Clear redo stack when new action is performed

    if (this.history.undoStack.length > this.history.maxHistory) {
      this.history.undoStack.shift();
    }

    this.emit("historyChanged", { canUndo: this.canUndo(), canRedo: this.canRedo() });
  }

  private clearHistory(): void {
    this.history.undoStack = [];
    this.history.redoStack = [];
    this.emit("historyChanged", { canUndo: false, canRedo: false });
  }

  private getFeatureById(featureId: string): LayerFeature | null {
    const feature = this.featureIndex.get(featureId);
    return feature != null ? { ...feature, properties: { ...feature.properties } } : null;
  }

  private getSelectedFeaturesAsLayerFeatures(): LayerFeature[] {
    if (!this.project) return [];

    const features: LayerFeature[] = [];

    this.state.selectedFeatures.forEach((featureId) => {
      const feature = this.getFeatureById(featureId);
      if (feature) features.push(feature);
    });

    return features;
  }

  private calculateFeaturesBounds(features: LayerFeature[]): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  } {
    if (features.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }

    let minX = features[0].x;
    let minY = features[0].y;
    let maxX = features[0].x;
    let maxY = features[0].y;

    features.forEach((feature) => {
      minX = Math.min(minX, feature.x);
      minY = Math.min(minY, feature.y);
      maxX = Math.max(maxX, feature.x);
      maxY = Math.max(maxY, feature.y);
    });

    return { minX, minY, maxX, maxY };
  }

  private generateNewId(originalId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const prefix = originalId.split("-")[0] || "copy";
    return `${prefix}-${timestamp}-${random}`;
  }

  private rebuildFeatureIndex(): void {
    this.featureIndex.clear();
    if (!this.project) return;
    if (this.project.type === "ship" && this.project.ship) {
      const ship = this.project.ship;
      // layers
      ship.layers.structure.walls.forEach((lf) => this.featureIndex.set(lf.id, lf));
      ship.layers.objects.doors.forEach((lf) => this.featureIndex.set(lf.id, lf));
      ship.layers.objects.stations.forEach((lf) => this.featureIndex.set(lf.id, lf));
      ship.layers.rooms.rooms.forEach((lf) => this.featureIndex.set(lf.id, lf));
    } else if (this.project.type === "planet" && this.project.planet) {
      const planet = this.project.planet;
      planet.layers.terrain.features.forEach((lf) => this.featureIndex.set(lf.id, lf));
      planet.layers.resources.deposits.forEach((lf) => this.featureIndex.set(lf.id, lf));
      planet.layers.decorations.decorations.forEach((lf) => this.featureIndex.set(lf.id, lf));
      // painted areas don't fit LayerFeature; skip indexing for clipboard
    }
  }

  private applyAdd(features: LayerFeature[]): void {
    if (!this.project) return;
    if (this.project.type === "ship" && this.project.ship) {
      const ship = this.project.ship;
      for (const lf of features) {
        if (lf.type === "wall") {
          const wall = this.layerFeatureToWall(lf);
          ship.walls.push(wall);
          ship.layers.structure.walls.push(lf);
        } else if (lf.type === "door") {
          const door = this.layerFeatureToDoor(lf);
          ship.doors.push(door);
          ship.layers.objects.doors.push(lf);
        } else if (lf.type === "station") {
          const st = this.layerFeatureToStation(lf);
          ship.stations.push(st);
          ship.layers.objects.stations.push(lf);
        }
      }
    } else if (this.project.type === "planet" && this.project.planet) {
      const planet = this.project.planet;
      for (const lf of features) {
        if (lf.type === "rock" || lf.type === "vegetation" || lf.type === "structure") {
          const tf = this.layerFeatureToTerrain(lf);
          planet.terrain.push(tf);
          planet.layers.terrain.features.push(lf);
        }
      }
    }
  }

  private applyRemove(featureIds: string[]): void {
    if (!this.project) return;
    if (this.project.type === "ship" && this.project.ship) {
      const ship = this.project.ship;
      const removeById = (arr: { id: string }[]): void => {
        for (let i = arr.length - 1; i >= 0; i--) {
          if (featureIds.includes(arr[i].id)) arr.splice(i, 1);
        }
      };
      removeById(ship.walls);
      removeById(ship.doors);
      removeById(ship.stations);
      removeById(ship.layers.structure.walls);
      removeById(ship.layers.objects.doors);
      removeById(ship.layers.objects.stations);
    } else if (this.project.type === "planet" && this.project.planet) {
      const planet = this.project.planet;
      const removeById = (arr: { id: string }[]): void => {
        for (let i = arr.length - 1; i >= 0; i--) {
          if (featureIds.includes(arr[i].id)) arr.splice(i, 1);
        }
      };
      removeById(planet.terrain);
      removeById(planet.layers.terrain.features);
    }
  }

  private applyModify(features: LayerFeature[]): void {
    if (!this.project) return;
    const replaceById = <T extends { id: string }>(
      arr: T[],
      updater: (id: string) => T | null,
    ): void => {
      for (let i = 0; i < arr.length; i++) {
        const next = updater(arr[i].id);
        if (next) arr[i] = next;
      }
    };
    if (this.project.type === "ship" && this.project.ship) {
      const ship = this.project.ship;
      // Update layer features
      replaceById(
        ship.layers.structure.walls,
        (id) => features.find((feature) => feature.id === id) ?? null,
      );
      replaceById(
        ship.layers.objects.doors,
        (id) => features.find((feature) => feature.id === id) ?? null,
      );
      replaceById(
        ship.layers.objects.stations,
        (id) => features.find((feature) => feature.id === id) ?? null,
      );
      // Update domain arrays based on updated layer features
      replaceById(ship.walls, (id) => {
        const lf = features.find((feature) => feature.id === id);
        return lf != null ? this.layerFeatureToWall(lf) : null;
      });
      replaceById(ship.doors, (id) => {
        const lf = features.find((feature) => feature.id === id);
        return lf != null ? this.layerFeatureToDoor(lf) : null;
      });
      replaceById(ship.stations, (id) => {
        const lf = features.find((feature) => feature.id === id);
        return lf != null ? this.layerFeatureToStation(lf) : null;
      });
    } else if (this.project.type === "planet" && this.project.planet) {
      const planet = this.project.planet;
      replaceById(
        planet.layers.terrain.features,
        (id) => features.find((feature) => feature.id === id) ?? null,
      );
      replaceById(planet.terrain, (id) => {
        const lf = features.find((feature) => feature.id === id);
        return lf != null ? this.layerFeatureToTerrain(lf) : null;
      });
    }
  }

  private layerFeatureToWall(lf: LayerFeature): Wall {
    const x1 = typeof lf.properties["x1"] === "number" ? lf.properties["x1"] : lf.x;
    const y1 = typeof lf.properties["y1"] === "number" ? lf.properties["y1"] : lf.y;
    const x2 = typeof lf.properties["x2"] === "number" ? lf.properties["x2"] : lf.x;
    const y2 = typeof lf.properties["y2"] === "number" ? lf.properties["y2"] : lf.y;
    const thicknessValue =
      typeof lf.properties["thickness"] === "number" ? lf.properties["thickness"] : 8;
    const wallTypeProp = lf.properties["wallType"];
    const type =
      wallTypeProp === "hull" || wallTypeProp === "interior" || wallTypeProp === "reinforced"
        ? wallTypeProp
        : "interior";
    return { id: lf.id, x1, y1, x2, y2, thickness: thicknessValue, type };
  }

  private layerFeatureToDoor(lf: LayerFeature): Door {
    const width = typeof lf.properties["width"] === "number" ? lf.properties["width"] : 32;
    const height = typeof lf.properties["height"] === "number" ? lf.properties["height"] : 8;
    const orientationProp = lf.properties["orientation"];
    const orientation =
      orientationProp === "horizontal" || orientationProp === "vertical"
        ? orientationProp
        : "horizontal";
    const isOpen = typeof lf.properties["isOpen"] === "boolean" ? lf.properties["isOpen"] : false;
    const doorTypeProp = lf.properties["doorType"];
    const type =
      doorTypeProp === "sliding" || doorTypeProp === "manual" || doorTypeProp === "airlock"
        ? doorTypeProp
        : "sliding";
    return {
      id: lf.id,
      x: lf.x,
      y: lf.y,
      width,
      height,
      orientation,
      isOpen,
      connectsRooms: ["", ""],
      type,
    };
  }

  private layerFeatureToStation(lf: LayerFeature): InteractiveStation {
    const stationTypeProp = lf.properties["stationType"];
    const type =
      stationTypeProp === "pilot_console" ||
      stationTypeProp === "cargo_terminal" ||
      stationTypeProp === "engine_controls" ||
      stationTypeProp === "navigation" ||
      stationTypeProp === "life_support"
        ? stationTypeProp
        : "pilot_console";
    const radius = typeof lf.properties["radius"] === "number" ? lf.properties["radius"] : 24;
    const name = typeof lf.properties["name"] === "string" ? lf.properties["name"] : "Console";
    const functionalityProp = lf.properties["functionality"];
    const functionality =
      functionalityProp === "teleport_to_cockpit" ||
      functionalityProp === "ship_systems" ||
      functionalityProp === "storage" ||
      functionalityProp === "information"
        ? functionalityProp
        : "ship_systems";
    return { id: lf.id, x: lf.x, y: lf.y, type, name, radius, functionality };
  }

  private layerFeatureToTerrain(lf: LayerFeature): {
    id: string;
    x: number;
    y: number;
    type: "rock" | "vegetation" | "structure";
    size: number;
  } {
    const terrainType =
      lf.type === "rock" || lf.type === "vegetation" || lf.type === "structure" ? lf.type : "rock";
    const size = typeof lf.properties["size"] === "number" ? lf.properties["size"] : 16;
    return { id: lf.id, x: lf.x, y: lf.y, type: terrainType, size };
  }

  // Performance optimization methods

  public getViewportBounds(): { x: number; y: number; width: number; height: number } {
    const now = performance.now();

    // Use cached bounds if still valid
    if (
      this.viewportCache.bounds &&
      now - this.viewportCache.lastUpdate < this.viewportCache.cacheTimeout
    ) {
      return this.viewportCache.bounds;
    }

    // Calculate new bounds
    const { x, y, zoom } = this.state.camera;
    const bounds = {
      x,
      y,
      width: this.config.canvasWidth / zoom,
      height: this.config.canvasHeight / zoom,
    };

    // Cache the result
    this.viewportCache.bounds = bounds;
    this.viewportCache.lastUpdate = now;

    return bounds;
  }

  public shouldThrottleRender(): boolean {
    const now = performance.now();
    return now - this.lastRenderTime < this.renderThrottleMs;
  }

  public updateRenderTime(): void {
    this.lastRenderTime = performance.now();
  }

  // Memory cleanup
  public cleanup(): void {
    // Clear viewport cache
    this.viewportCache.bounds = null;
    this.viewportCache.lastUpdate = 0;

    // Clear history to free memory
    this.clearHistory();

    // Clear all event listeners
    this.listeners = {
      projectChanged: [],
      toolChanged: [],
      modeChanged: [],
      selectionChanged: [],
      cameraChanged: [],
      historyChanged: [],
      mouseDown: [],
      mouseMove: [],
      mouseUp: [],
      actionExecuted: [],
      actionUndone: [],
      selectionUpdate: [],
      clipboardChanged: [],
      selectAll: [],
      toolPropertiesChanged: [],
    };

    // Remove canvas event listeners if canvas exists
    if (this.canvas) {
      this.canvas.removeEventListener("mousedown", this.onMouseDown);
      this.canvas.removeEventListener("mousemove", this.onMouseMove);
      this.canvas.removeEventListener("mouseup", this.onMouseUp);
      this.canvas.removeEventListener("wheel", this.onWheel);
    }

    document.removeEventListener("keydown", this.onKeyDown);
  }
}
