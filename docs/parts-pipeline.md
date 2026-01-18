# Parts Asset Pipeline Documentation

## Overview
This pipeline allows 3D parts to be ingested, optimized, and attached to user builds. It mirrors the core car pipeline but focuses on modular attachments.

## 1. Asset Ingestion
**Script**: `scripts/process-parts.js`
**Helper**: `scripts/blender/optimize_part.py`

### Usage
```bash
node scripts/process-parts.js --input ./raw_models/wheel_te37.glb --output wheel_te37 --category wheel --brand Rays
```

### Steps
1.  **Validation**: Checks input GLB.
2.  **Optimization**: Runs Blender script to decimate geometry and apply Draco compression.
3.  **Upload**: Uploads to `assets/parts/{partId}/v1/model.glb`.
4.  **Registration**: Creates document in `parts` collection.

## 2. Data Schema

### `parts/{partId}`
Global catalog of 3D parts.
-   `storagePath`: Path to the optimized GLB.
-   `meta`: Bounding box, tri count, defaults.
-   `placementDefaults`: Where it attaches (e.g., `ANCHOR_WHEEL_*`).

### `users/{uid}/cars/{carId}/parts/{partId}` (Inventory)
User's "owned" parts.
-   `status`: 'installed', 'in_storage', 'sold'.

### activeBuild (in `builds` collection)
-   `installedParts`: Array of currently attached parts with transform overrides.
-   `installedPartIds`: Simple array for indexing/searching.

## 3. 3D Viewer Integration
**Component**: `src/screens/CarModelViewerScreen.tsx`
**Service**: `src/services/PartService.ts`

The viewer now accepts an `installedParts` prop. It:
1.  Traverses the car model for nodes starting with `ANCHOR_`.
2.  Fetches part GLBs from `parts` collection.
3.  Attaches parts to matching anchors (applying scale/offset).

## 4. Try-On Candidate System
**Service**: `src/services/CandidateService.ts`
**Cloud Function**: `functions/src/parts/processCandidate.ts`

Users can submit URLs (e.g., product pages). The system:
1.  Creates a `partCandidates` doc.
2.  Cloud Function scrapes metadata (OpenGraph).
3.  Attempts basic keyword matching.
4.  Updates status to 'resolved'.

## 5. Development Tips
-   **Debugging**: Use `CandidateService.monitorCandidate` to see extraction results in real-time.
-   **Testing**: Use `PartTryOnScreen` to simulate parts locally before saving.
