# Map Maker Tool - Manual Test Cases

This document provides manual test cases for the map-maker tool implementation based on ADR-0011. Each test case should be performed manually to verify functionality works as expected.

## Test Environment Setup

### Prerequisites

1. Ensure the development server is running (`npm run dev`)
2. Navigate to the map-maker tool (integration point TBD)
3. Verify the tool loads without console errors

### Initial State Verification

- [ ] **MapMaker Interface Loads**: Confirm the map-maker interface displays with three panels (left tools, center canvas, right layers)
- [ ] **Default Project**: Verify a default ship project is created automatically
- [ ] **Grid Display**: Confirm grid is visible on the canvas with proper spacing
- [ ] **Tool Panel**: Verify tool panel shows ship tools by default (Select, Wall Builder, Door Placement, Station Placement, Floor Texture, Room Fill)

## Core Functionality Tests

### 1. Mode Switching

**Test Case**: Verify switching between Ship and Planet editing modes

**Steps:**

1. Click "Switch to Planet" button in the mode panel
2. Observe tool panel changes to planet tools
3. Click "Switch to Ship" button
4. Observe tool panel returns to ship tools

**Expected Results:**

- [ ] Mode toggle button updates text appropriately
- [ ] Tool panel displays correct tools for each mode
- [ ] Grid size changes appropriately (16px for ship, 32px for planet)
- [ ] No console errors during mode switching

### 2. Tool Selection

**Test Case**: Verify tool selection and property panel updates

**Steps:**

1. Click on different tools in the tool panel
2. Observe property panel updates for each tool
3. Verify tool becomes highlighted/active

**Expected Results:**

- [ ] Clicking a tool highlights it as active
- [ ] Property panel shows relevant properties for selected tool
- [ ] Property controls are functional (sliders, dropdowns, etc.)
- [ ] Tool cursor changes appropriately on canvas hover

## Ship Editor Functionality

### 3. Wall Drawing Tool

**Test Case**: Create walls with mouse-based drawing and grid snapping

**Steps:**

1. Select "Wall Builder" tool
2. Click on canvas to start drawing a wall
3. Move mouse to another position
4. Click to finish the wall
5. Repeat to create multiple connected walls

**Expected Results:**

- [ ] Click and drag creates a preview wall line
- [ ] Wall snaps to grid points
- [ ] Completed walls appear with proper thickness
- [ ] Walls are added to the project and visible on canvas
- [ ] Wall properties can be modified (thickness, type) via property panel

### 4. Door Placement Tool

**Test Case**: Place doors along existing walls

**Prerequisites**: Have at least one wall created

**Steps:**

1. Select "Door Placement" tool
2. Click near an existing wall
3. Observe door placement behavior
4. Try clicking in empty space (should not place door)
5. Try placing multiple doors on the same wall

**Expected Results:**

- [ ] Doors place automatically along nearest wall when clicking near one
- [ ] Doors orient correctly (horizontal/vertical) based on wall direction
- [ ] Doors cannot be placed too close to each other
- [ ] Doors do not place in empty space far from walls
- [ ] Door properties (type, width) can be modified

### 5. Station Placement Tool

**Test Case**: Place interactive stations in ship interior

**Steps:**

1. Select "Station Placement" tool
2. Click in various positions on the canvas
3. Try different station types via property panel
4. Observe interaction radius display

**Expected Results:**

- [ ] Stations place at clicked positions
- [ ] Station type can be changed (pilot console, cargo terminal, etc.)
- [ ] Interaction radius is visible as dashed circle
- [ ] Stations snap to grid if snap is enabled
- [ ] Station radius can be adjusted via properties

### 6. Selection Tool

**Test Case**: Select and manage placed objects

**Prerequisites**: Have walls, doors, and stations placed

**Steps:**

1. Select "Select" tool
2. Click on individual objects (walls, doors, stations)
3. Try click-and-drag selection for multiple objects
4. Click in empty space to clear selection

**Expected Results:**

- [ ] Single objects can be selected by clicking
- [ ] Selected objects are visually highlighted
- [ ] Multiple objects can be selected with drag selection
- [ ] Selection clears when clicking empty space
- [ ] Selected object count updates in UI

### 7. Room Detection

**Test Case**: Verify automatic room detection when walls form enclosed spaces

**Steps:**

1. Use Wall Builder to create a closed rectangular shape (4 walls forming a room)
2. Observe room detection in the layers panel
3. Create a more complex multi-room layout
4. Place doors between rooms

**Expected Results:**

- [ ] Rooms are automatically detected when walls form closed shapes
- [ ] Room outlines are visible in the room layer
- [ ] Rooms appear in the layers panel
- [ ] Room detection updates when walls are added/removed
- [ ] Doors connect appropriate rooms (connectsRooms property)

### 8. Enhanced Ship Editor Integration

**Test Case**: Verify enhanced ship editor features work seamlessly

**Steps:**

1. Create walls using the wall drawing tool
2. Place doors using enhanced door placement with wall detection
3. Add stations and verify enhanced placement features
4. Test room detection integration
5. Verify all ship editor tools work with the enhanced backend

**Expected Results:**

- [ ] Enhanced wall drawing provides smooth line preview
- [ ] Door placement intelligently finds nearest walls
- [ ] Station placement integrates with room detection system
- [ ] Enhanced ship editor maintains compatibility with basic ship editor
- [ ] Room detection works automatically as walls are added
- [ ] Tool switching between enhanced and basic features is seamless

## Planet Editor Functionality

### 9. Planet Mode Switching

**Test Case**: Verify switching to planet editor mode

**Steps:**

1. Start in ship mode
2. Click "Switch to Planet" button
3. Observe interface changes
4. Verify default planet project creation

**Expected Results:**

- [ ] Tool panel shows planet-specific tools (Rock, Hill, Structure, Village, Biome, Terrain Height)
- [ ] Grid changes to 32px spacing (larger than ship mode)
- [ ] Default planet project is created with landing site
- [ ] Canvas updates to show planet surface view

### 10. Rock Placement Tool

**Test Case**: Place rock formations on planet surface

**Steps:**

1. Switch to planet mode
2. Select "Rock" tool
3. Click various positions on canvas
4. Verify rock properties can be modified

**Expected Results:**

- [ ] Rocks appear as gray circles at clicked positions
- [ ] Rocks snap to grid when snap is enabled
- [ ] Rock size can be adjusted via property panel
- [ ] Multiple rocks can be placed without interference

### 11. Structure Placement Tool

**Test Case**: Place structures on planet surface

**Steps:**

1. Select "Structure" tool
2. Click positions on canvas to place structures
3. Try different structure sizes via properties
4. Place structures near other terrain features

**Expected Results:**

- [ ] Structures appear as brown/tan colored shapes
- [ ] Structure size is larger than rocks by default
- [ ] Structures can be placed anywhere on surface
- [ ] Property panel allows size adjustment

### 12. Village Placement Tool

**Test Case**: Generate procedural villages

**Steps:**

1. Select "Village" tool
2. Click on open area of planet surface
3. Observe village generation
4. Try placing multiple villages

**Expected Results:**

- [ ] Clicking generates cluster of 5 buildings in village area
- [ ] Buildings are randomly positioned within village bounds
- [ ] Each building has random size variation
- [ ] Villages don't overlap inappropriately
- [ ] Buildings appear as structure-type terrain features

### 13. Terrain Height Tool

**Test Case**: Apply terrain height modifications

**Steps:**

1. Select "Hill" or "Terrain Height" tool
2. Click and drag on planet surface
3. Observe brush application
4. Test different brush sizes if available

**Expected Results:**

- [ ] Terrain markers appear where brush is applied
- [ ] Brush works during click-and-drag operations
- [ ] Terrain modifications are added as vegetation-type features
- [ ] Brush size affects area of effect

### 14. Biome Painting Tool

**Test Case**: Paint biome areas on planet surface

**Steps:**

1. Select "Biome" tool
2. Click various areas on planet surface
3. Verify biome changes in project data
4. Test painting different biome types if available

**Expected Results:**

- [ ] Biome painting updates planet's biome property
- [ ] Painted areas are recorded in biome layer
- [ ] Multiple biome areas can be painted
- [ ] Biome painting affects overall planet appearance

### 15. Planet Selection Tool

**Test Case**: Select and manage planet terrain features

**Steps:**

1. Place various terrain features (rocks, structures)
2. Select "Select" tool
3. Click on individual terrain features
4. Test multi-selection capabilities

**Expected Results:**

- [ ] Individual terrain features can be selected
- [ ] Selected features are visually highlighted
- [ ] Selection works for all terrain feature types
- [ ] Multi-selection functions properly
- [ ] Feature properties can be viewed/edited when selected

## Project Management

### 16. Save/Load Functionality

**Test Case**: Save and load map projects

**Steps:**

1. Create a simple ship layout with walls, doors, and stations
2. Click "Save" button
3. Create a different layout
4. Use browser's local storage inspection to verify save
5. Refresh the page and verify persistence

**Expected Results:**

- [ ] Save button saves project to localStorage
- [ ] Project name and metadata are saved correctly
- [ ] Modified timestamp updates on save
- [ ] Projects persist across browser sessions

### 17. Export Functionality

**Test Case**: Export maps as .losemap.json files

**Steps:**

1. Create a test ship layout
2. Click "Export" button
3. Verify file download occurs
4. Inspect exported file content

**Expected Results:**

- [ ] Export triggers file download
- [ ] File has .losemap.json extension
- [ ] File contains valid JSON with all project data
- [ ] File includes metadata (name, author, timestamps)
- [ ] File can be imported/viewed externally

### 18. Saved Maps Browser

**Test Case**: Load maps from localStorage via the Saved Maps panel

**Steps:**

1. Save at least two different projects with distinct names
2. Open the "Saved Maps" panel in the left sidebar
3. Click a saved entry's `Load` button
4. Verify the project switches to the selected save
5. Use the `Delete` control on an entry and refresh the list

**Expected Results:**

- [ ] Saved Maps panel lists all `map-maker-*` entries from localStorage with metadata
- [ ] Loading a saved entry switches the active project and mode accordingly
- [ ] Deleting an entry removes it from localStorage after refresh
- [ ] Panel reflects the currently active saved project highlight (if present)

## Layer Management

### 19. Layer Visibility and Opacity

**Test Case**: Control layer visibility and opacity

**Steps:**

1. Create a layout with multiple object types
2. Toggle visibility for different layers (Structure, Objects, Rooms, Lighting)
3. Adjust opacity sliders for layers
4. Test layer reordering (if implemented)

**Expected Results:**

- [ ] Toggling layer visibility shows/hides appropriate objects
- [ ] Opacity sliders affect layer transparency
- [ ] Layer changes update canvas display in real-time
- [ ] Layer controls are intuitive and responsive

## Canvas Interaction

### 20. Camera Controls

**Test Case**: Pan and zoom the canvas view

**Steps:**

1. Use middle mouse button to pan around the canvas
2. Use mouse wheel to zoom in and out
3. Test zoom limits (both min and max)
4. Verify grid visibility at different zoom levels

**Expected Results:**

- [ ] Middle mouse drag pans the view smoothly
- [ ] Mouse wheel zooms in/out centered on mouse position
- [ ] Zoom has reasonable limits (not too close/far)
- [ ] Grid remains visible and properly scaled at different zooms
- [ ] Camera position affects all rendered elements correctly

### 21. Grid Snapping

**Test Case**: Verify grid snapping behavior

**Steps:**

1. Enable grid snapping (should be default)
2. Place various objects and observe snapping
3. Try disabling snap (if option exists)
4. Test snapping with different grid sizes

**Expected Results:**

- [ ] Objects snap to grid intersections when placing
- [ ] Snap behavior is consistent across all tools
- [ ] Grid snap can be toggled on/off
- [ ] Snap works correctly at different zoom levels

## Error Handling and Edge Cases

### 22. Invalid Operations

**Test Case**: Verify handling of invalid user actions

**Steps:**

1. Try to place door with no walls present
2. Try to create wall with zero length (click same spot twice)
3. Try to place objects outside reasonable bounds
4. Test rapid clicking/dragging

**Expected Results:**

- [ ] Invalid door placement is prevented/ignored
- [ ] Zero-length walls are not created
- [ ] Objects stay within reasonable bounds
- [ ] Rapid input doesn't cause crashes or duplicate objects

### 23. Undo/Redo Functionality

**Test Case**: Verify undo/redo operations

**Steps:**

1. Create several objects
2. Click "Undo" button repeatedly
3. Click "Redo" button after undoing
4. Verify undo/redo button states

**Expected Results:**

- [ ] Undo removes most recent action
- [ ] Undo button disables when no actions to undo
- [ ] Redo restores previously undone actions
- [ ] Redo button disables when no actions to redo
- [ ] Action history is maintained correctly

### 24. Copy/Paste Functionality

**Test Case**: Copy and paste selected objects

**Prerequisites**: Have walls, doors, and stations placed

**Steps:**

1. Select "Select" tool
2. Select one or more objects by clicking or dragging
3. Press Ctrl+C (or Cmd+C on Mac) to copy
4. Move to a different area of the canvas
5. Press Ctrl+V (or Cmd+V on Mac) to paste
6. Verify paste button state in toolbar

**Expected Results:**

- [ ] Selected objects are copied to clipboard
- [ ] Paste button enables after copying
- [ ] Pasted objects appear at cursor/center position
- [ ] Pasted objects are offset from originals to avoid overlap
- [ ] Copy/paste works across different areas of the canvas
- [ ] Clipboard persists until new copy or page refresh

### 25. Keyboard Shortcuts

**Test Case**: Verify all keyboard shortcuts function correctly

**Prerequisites**: Have various objects placed for testing

**Steps:**

1. Test Ctrl+C (Copy) with selected objects
2. Test Ctrl+V (Paste) after copying
3. Test Ctrl+Z (Undo) to undo recent actions
4. Test Ctrl+Y (Redo) to redo undone actions
5. Test Ctrl+Shift+Z (Alternative Redo)
6. Test Delete key with selected objects
7. Test Backspace key with selected objects
8. Test Ctrl+A (Select All) to select all objects
9. Test Escape key during various operations

**Expected Results:**

- [ ] Ctrl+C copies selected objects
- [ ] Ctrl+V pastes from clipboard
- [ ] Ctrl+Z undoes last action
- [ ] Ctrl+Y and Ctrl+Shift+Z redo actions
- [ ] Delete and Backspace remove selected objects
- [ ] Ctrl+A selects all visible objects in current mode
- [ ] Escape cancels current drawing operation and clears selection
- [ ] Keyboard shortcuts work regardless of focused UI element
- [ ] No conflicts with browser shortcuts

## Performance and Usability

### 26. Performance Optimizations

**Test Case**: Verify performance optimizations are working effectively

**Prerequisites**: Create a complex layout with 50+ objects

**Steps:**

1. Monitor FPS during canvas operations (use browser dev tools)
2. Test viewport culling by zooming out to see many objects
3. Test render throttling by rapidly moving mouse over canvas
4. Zoom to very close level and verify grid visibility optimization
5. Pan around complex layout and monitor performance
6. Switch between ship and planet modes with complex layouts

**Expected Results:**

- [ ] Canvas maintains 60 FPS or close during normal operations
- [ ] Objects outside viewport are culled from rendering
- [ ] Render throttling prevents excessive redraws
- [ ] Grid disappears at extreme zoom levels to improve performance
- [ ] Viewport bounds caching reduces calculation overhead
- [ ] Memory cleanup prevents accumulation of unused objects
- [ ] Complex layouts remain responsive

### 27. Responsiveness

**Test Case**: Verify tool remains responsive with complex layouts

**Steps:**

1. Create a complex layout with many walls, doors, and stations (50+ objects)
2. Test all tool operations with complex layout
3. Monitor performance during canvas operations

**Expected Results:**

- [ ] Canvas renders smoothly with many objects
- [ ] Tool switching remains fast
- [ ] Room detection completes in reasonable time
- [ ] No significant lag during user interactions

### 28. Visual Feedback

**Test Case**: Verify appropriate visual feedback for user actions

**Steps:**

1. Test tool preview displays (wall drawing preview, etc.)
2. Verify object highlighting and selection feedback
3. Check cursor changes for different tools
4. Observe hover effects

**Expected Results:**

- [ ] Tool previews are clearly visible during operation
- [ ] Selected objects are visually distinct
- [ ] Cursors indicate current tool/mode
- [ ] Hover effects provide useful feedback
- [ ] Room fills render with high-contrast gradients and readable labels
- [ ] Station icons show distinct glyphs/colors for each station type

## Integration Points

### 29. Type Safety

**Test Case**: Verify TypeScript compilation and type safety

**Steps:**

1. Run `npm run typecheck`
2. Verify no TypeScript errors in map-maker code
3. Test tool operations don't cause runtime type errors

**Expected Results:**

- [ ] TypeScript compilation passes without errors
- [ ] Runtime type errors are not thrown during normal operations
- [ ] Type safety is maintained across tool operations

## Known Issues / Future Improvements

Document any issues discovered during testing:

- [ ] **Issue**: [Description]
  - **Severity**: [High/Medium/Low]
  - **Reproduction**: [Steps to reproduce]
  - **Workaround**: [If any]

- [ ] **Enhancement**: [Description]
  - **Priority**: [High/Medium/Low]
  - **Details**: [Implementation notes]

## Test Results Summary

**Test Date**: \***\*\_\_\_\*\***
**Tester**: \***\*\_\_\_\*\***
**Version/Commit**: \***\*\_\_\_\*\***

**Overall Results**:

- [ ] All core functionality works as expected
- [ ] Minor issues found (documented above)
- [ ] Major issues found (requires fixes before release)
- [ ] Ready for integration with main game

**Notes**:

---

---

---
