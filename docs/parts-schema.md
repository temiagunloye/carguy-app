# Parts Pipeline Schema

## Overview

This document defines the schema for 3D parts independent of cars, and how they are attached to user builds.

## Collections

### parts
Path: `parts/{partId}`

Global catalog of available 3D parts.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `partId` | string | ✓ | Unique ID (e.g., "wheel_te37_bronze") |
| `name` | string | ✓ | Display name |
| `category` | string | ✓ | "wheel", "spoiler", "bumper", "hood", "roof", "etc" |
| `brand` | string | | Brand name (if real) |
| `sku` | string | | Manufacturer SKU |
| `activeVersion` | string | ✓ | Semantic version (e.g., "v1") |
| `storagePath` | string | ✓ | Path to GLB: `assets/parts/{partId}/{version}/model.glb` |
| `meta` | object | ✓ | 3D metadata |
| `placementDefaults` | object | ✓ | Default transform info |
| `compatibility` | object | | Rules for fitting |
| `source` | object | | License/Provenance info |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

**Meta Object:**
```json
{
  "bbox": { "min": [x,y,z], "max": [x,y,z] },
  "dimensionsMm": { "x": 100, "y": 100, "z": 100 },
  "triCount": 1500,
  "defaultScale": 1.0,
  "materials": ["chrome", "rubber"]
}
```

**PlacementDefaults Object:**
```json
{
  "anchorName": "ANCHOR_WHEEL_*", // Wildcard or specific
  "offset": { "x": 0, "y": 0, "z": 0 },
  "rotation": { "x": 0, "y": 0, "z": 0 },
  "scaleMode": "relativeToWheelAnchors" // or "fixed", "relativeToCarWidth"
}
```

---

### Part Candidates (Try-On)
Path: `partCandidates/{candidateId}`

User-submitted links/images for the try-on demo.

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `submittedByUid` | string | ✓ | User ID |
| `input` | object | ✓ | `{ type: "link", url: "..." }` |
| `status` | string | ✓ | "pending", "processing", "resolved", "failed" |
| `extracted` | object | | Data scraped from URL |
| `resolution` | object | | `{ mode: "3d_match" | "community_ref" | "placeholder" }` |
| `renderPlan` | object | | Instructions for the viewer |

---

## User Data

### Installed Parts
Path: `users/{uid}/garages/{garageId}/builds/{buildId}`

The `installedParts` field is an array of objects within the build document (or a subcollection if simple array gets too large, but array is fine for v1).

**Field: `installedParts` (Array)**

```json
[
  {
    "partId": "wheel_te37_bronze",
    "instanceId": "uuid-v4",
    "anchorId": "ANCHOR_WHEEL_FL",
    "config": {
       "offset": { "x": 0.01, "y": 0, "z": 0 }, // Fine-tuning
       "scale": 1.05
    },
    "addedAt": "2024-01-01T12:00:00Z"
  }
]
```
