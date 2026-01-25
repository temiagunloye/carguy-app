# Advanced Vehicle Reference Database Schema

## 1. Top-Level Collection: `standardCars`
Indexed by unique `standardCarId` (e.g. `porsche_911_gt3_992_2024`).

### Document Structure:
```json
{
  "id": "porsche_911_gt3_992_2024",
  "make": "Porsche",
  "model": "911",
  "trim": "GT3",
  "year": 2024,
  "generation": "992",
  "bodyStyle": "Coupe",
  
  // The "Forza Style" Reference Set
  "photoAnglesHttp": {
    "front": "https://storage.../front.png",
    "front_left": "https://storage.../front_left.png",
    "left": "https://storage.../left.png",
    "rear_left": "https://storage.../rear_left.png",
    "rear": "https://storage.../rear.png",
    "rear_right": "https://storage.../rear_right.png",
    "right": "https://storage.../right.png",
    "front_right": "https://storage.../front_right.png",
    "front_center": "https://storage.../front_center.png",
    "front_low": "https://storage.../front_low.png"
  },
  
  // Metadata for Masks (Parts)
  "masks": {
    "wheels": "https://storage.../masks/wheels.png",
    "windows": "https://storage.../masks/windows.png",
    "body": "https://storage.../masks/body.png"
  },
  
  // Source Tracking
  "source": "blender_studio_v1", // or "carvana_scrape_v1"
  "lastUpdated": "2026-01-24T..."
}
```

## 2. Ingestion Pipeline
1.  **Acquire:** `npm run ingest:acquire` (Scrapes raw images/models).
2.  **Normalize:** `npm run ingest:render` (Blender Studio -> Uniform PNGs).
3.  **Index:** `npm run ingest:upload-render` (Updates Firestore).

## 3. Storage Hierarchy (Firebase Storage)
`gs://carguy-app-demo.appspot.com/standardCars/{id}/`
├── `renders/` (The Final Assets)
│   ├── `front.png`
│   └── ...
├── `raw/` (Source GLB/JPGs)
└── `masks/` (Segmentation Masks)
