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

## D. Try-On System
- [ ] Go to "The Shop" -> "Try Part on Build" (Simulate).
- [ ] Enter a Product Name and Link.
- [ ] Click "Simulate".
- [ ] Verify "Analysis: PENDING" -> "Analysis: RESOLVED" (matches "borla" keyword if used).
- [ ] Toggle part ON -> "Save to Build".
- [ ] Verify it lands in Inventory.

## E. Build Examples
- [ ] Ensure a part is installed on a build.
- [ ] Navigate to Part Detail Screen for that part.
- [ ] Verify "Seen on Builds" section appears with the build listed.
