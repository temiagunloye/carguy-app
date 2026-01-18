#!/bin/bash

# Phase A: Process all 3 base models with anchors
# This script adds anchors to GLBs, extracts metadata, and updates Firestore

set -e  # Exit on error

echo "========================================="
echo "Phase A: Anchor Processing for 3 Demo Cars"
echo "========================================="
echo ""

# Define models
MODELS=(
  "porsche_911_2024:assets/optimized-models/porsche_911_2024.glb"
  "bmw_m3_2023:assets/optimized-models/bmw_m3_2023.glb"
  "subaru_brz_2022:assets/optimized-models/subaru_brz_2024.glb"
)

# Create tmp directory
mkdir -p tmp/anchors

for model_spec in "${MODELS[@]}"; do
  IFS=':' read -r MODEL_ID INPUT_GLB <<< "$model_spec"
  
  echo "Processing: $MODEL_ID"
  echo "  Input: $INPUT_GLB"
  
  # Check if input exists
  if [ ! -f "$INPUT_GLB" ]; then
    echo "  ❌ GLB not found: $INPUT_GLB"
    echo "  Skipping..."
    continue
  fi
  
  # Step 1: Add anchors to GLB
  OUTPUT_GLB="tmp/anchors/${MODEL_ID}_with_anchors.glb"
  echo "  Step 1: Adding anchors..."
  blender --background --python scripts/blender/add_anchors.py -- "$INPUT_GLB" "$OUTPUT_GLB" 2>&1 | grep -E "(Car dimensions|Created anchor|Added.*anchor|Export complete)"
  
  if [ ! -f "$OUTPUT_GLB" ]; then
    echo "  ❌ Failed to create GLB with anchors"
    continue
  fi
  
  # Step 2: Extract anchor metadata
  ANCHORS_JSON="tmp/anchors/${MODEL_ID}_anchors.json"
  echo "  Step 2: Extracting anchor metadata..."
  blender --background --python scripts/blender/extract_anchor_metadata.py -- "$OUTPUT_GLB" "$ANCHORS_JSON" 2>&1 | grep -E "(Found:|Extracted)"
  
  if [ ! -f "$ANCHORS_JSON" ]; then
    echo "  ❌ Failed to extract anchors"
    continue
  fi
  
  # Step 3: Update Firestore
  echo "  Step 3: Updating Firestore baseModels/$MODEL_ID..."
  node scripts/update-base-model-anchors.js "$MODEL_ID" "$ANCHORS_JSON"
  
  echo "  ✅ Completed: $MODEL_ID"
  echo ""
done

echo "========================================="
echo "Phase A Complete!"
echo "========================================="
echo ""
echo "Generated files in tmp/anchors/:"
ls -lh tmp/anchors/
echo ""
echo "Next: Verify anchors in Firestore Console"
echo "https://console.firebase.google.com/project/carguy-app-demo/firestore/data/~2FbaseModels"
