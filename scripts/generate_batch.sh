#!/bin/bash
# scripts/generate_batch.sh

echo "🚀 Starting Batch Generation via Canonical Pipeline..."

# 1. Porsche 911 (Army Green + Gloss)
echo "----------------------------------------"
echo "Job 1/3: Porsche 911 (Army Green)"
blender --background --python scripts/blender/canonical_render.py -- \
    assets/optimized-models/porsche_911_2024.glb \
    renders/batch_01/porsche_911_2024_army_green \
    "#4B5320" 0.3

# 2. Subaru BRZ (Matte Black)
echo "----------------------------------------"
echo "Job 2/3: Subaru BRZ (Matte Black)"
# Note: Using 2024 model for 2022 request (likely same chassis code or placeholder)
blender --background --python scripts/blender/canonical_render.py -- \
    assets/optimized-models/subaru_brz_2024.glb \
    renders/batch_01/subaru_brz_2022_matte_black \
    "#1C1C1C" 0.9

# 3. BMW M3 (Toronto Red + Metallic)
echo "----------------------------------------"
echo "Job 3/3: BMW M3 (Toronto Red)"
blender --background --python scripts/blender/canonical_render.py -- \
    assets/optimized-models/bmw_m3_2023.glb \
    renders/batch_01/bmw_m3_2024_toronto_red \
    "#FF3333" 0.3

echo "----------------------------------------"
echo "✅ Batch Complete. Check renders/batch_01/"
