# Implementation Plan: Vision-Agent & Background Control

**Goal:** Enable the "Option A" (Blender Render) pipeline and provide a "Set Background" feature in the Simulator.

## User Review Required
> [!IMPORTANT]
> I cannot run the Blender Render (`ingest:render`) in this cloud environment due to lack of GPU. I will download a **Sample Model** for you, but you must run the render command locally.

## Proposed Changes

### 1. Acquisition (Scripts)
#### [NEW] [download_models.js](file:///Users/temiagunloye/Desktop/carguy-app/scripts/download_models.js)
- Script to download a sample GLB (Khronos ToyCar) to `assets/models/raw/porsche_911.glb`.
- This allows you to verify the `ingest:render` command immediately.

### 2. Simulator UI (Backgrounds)
#### [MODIFY] [simulator.html](file:///Users/temiagunloye/Desktop/carguy-app/website/shop/simulator.html)
- Add a "Background Toggle" button group (Dark / Light / Transparent).
- Update container styles to support dynamic background changes.

#### [MODIFY] [visualizer.js](file:///Users/temiagunloye/Desktop/carguy-app/website/js/visualizer.js)
- Implement `setBackground(mode)` function.
- Modes:
    - `dark`: Radial Gradient (Current).
    - `light`: White/Grey Radial (For "Stock" look).
    - `studio`: Infinite Cyclorama image (Future).

## Verification Plan
1.  **Run Acquisition:** `node scripts/download_models.js` -> Verify `assets/models/raw/porsche_911.glb` exists.
2.  **Test UI:** Open Simulator -> Click "Light Mode" -> Verify background changes to white (Standard Stock style).
3.  **End-to-End:** User runs `npm run ingest:render` locally -> Replaces images with Renders -> Toggles background impacting the transparent PNGs.
