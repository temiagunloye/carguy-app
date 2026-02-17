# Source Models - Base GLB Files

**DO NOT COMMIT TO GIT**

This directory contains source GLB models for base car models.

## Storage Strategy

**Local (Development)**:
- Files stored in `source_models/base_glb/`
- Gitignored to prevent repo bloat

**Production (Firebase Storage)**:
- Upload to: `gs://your-bucket/models/source_glb/{modelName}.glb`
- Firestore registry in `models` collection tracks URLs

## Current Models

1. **BMW M3 (2023)**
   - File: `bmw_m3.glb`
   - Build ID: `m3_2023_stock_alpine_white`
   - Paint: Alpine White
   - Source: User upload

2. **Audi RS6 Avant (2020)**
   - File: `audi_rs6_2020.glb`
   - Build ID: `rs6_2024_stock_nardo_grey`
   - Paint: Nardo Grey
   - Source: User upload

3. **Porsche 911 GT3 Touring (2022)**
   - File: `porsche_gt3_2022.glb`
   - Build ID: `gt3_stock_guards_red`
   - Paint: Guards Red
   - Source: User upload

4. **Mercedes-Benz C63 S AMG Coupe (2019)**
   - File: `mercedes_c63_2019.glb`
   - Build ID: `c63_2024_stock_obsidian_black`
   - Paint: Obsidian Black
   - Source: User upload

## Usage

**Render with Blender**:
```bash
blender --background --python scripts/blender/render_base_models.py -- \
  --glb source_models/base_glb/bmw_m3.glb \
  --build-id m3_2023_stock_alpine_white \
  --color alpine_white \
  --output base_model_renders/m3_2023_stock_alpine_white \
  --year 2023 --make BMW --model M3 --trim Competition
```

**Upload to Firebase Storage**:
```bash
node scripts/upload_glb_to_storage.js
```
