# Smoke Test Checklist - Parts Pipeline

## A. Asset Pipeline
- [ ] Run `node scripts/process-parts.js` with a test GLB.
    - [ ] Verify script completes without error.
    - [ ] Check Firebase Console for new `parts/{partId}` document.
    - [ ] Check Firebase Storage for `assets/parts/{partId}/v1/model.glb`.

## B. Viewer Integration
- [ ] Open App -> Specific Car -> "Open 3D Configurator".
- [ ] Verify car loads.
- [ ] If parts are installed, verify they appear attached to anchors.
- [ ] Verify wheel rotation (if supported by animation loop).

## C. Inventory Management
- [ ] Go to Car Detail Screen -> "Add Part".
- [ ] Add a dummy part.
- [ ] Verify it appears in the list.
- [ ] Click "Install" -> Verify status changes to "Installed".
- [ ] Verify "Open 3D Configurator" button appears/is active.

## D. AI Ingestion (Add from Link)
- [ ] Go to Car Detail Screen -> "Add Part".
- [ ] Locate "Link" input field at the top.
- [ ] Paste a product URL (e.g., https://www.tirerack.com/wheels/bbs-lm-silver-w-machined-lip).
- [ ] Tap the "Download" icon.
- [ ] **Verify:** Loading spinner appears briefly.
- [ ] **Verify:** Form auto-fills with:
    - [ ] Name (e.g., "BBS LM")
    - [ ] Price (e.g., parsed value or null)
    - [ ] Image (should load the product image)
- [ ] Tap "Save".
- [ ] **Verify:** Part appears in inventory with "Analysis: Simulated" (or similar status).
- [ ] "Install" the part and open 3D Viewer.
- [ ] **Verify:** The "generic 5-spoke wheel" placeholder appears on the car (verifying 3D mapping).

## E. Build Examples
- [ ] Ensure a part is installed on a build.
- [ ] Navigate to Part Detail Screen for that part.
- [ ] Verify "Seen on Builds" section appears with the build listed.
