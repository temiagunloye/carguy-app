#!/bin/bash
set -e # Exit on error

# Configuration
BLENDER_EXEC="/Applications/Blender.app/Contents/MacOS/Blender"
SCRIPT_PATH="scripts/blender/render_porsche_hq.py"
GLB_PATH="assets/optimized-models/porsche_911_2024.glb"
UPLOAD_SCRIPT="scripts/upload-fresh-porsche.js"
SYNC_SCRIPT="scripts/sync_app_variants.js"

echo "🚀 Starting Consolidated Render & Upload Pipeline"
echo "==============================================="

# 1. RENDER (Parallel)
echo "📸 [1/3] Rendering 10 Angles (White & Yellow)..."
# We run these in background and wait
# $BLENDER_EXEC --background --python $SCRIPT_PATH -- $GLB_PATH tmp/final_staging/porsche_911_2024 white > tmp/render_white.log 2>&1 &
# PID_WHITE=$!
# echo "   Started White 911 (PID: $PID_WHITE)"

$BLENDER_EXEC --background --python $SCRIPT_PATH -- $GLB_PATH tmp/final_staging/porsche_911_manthey_build green > tmp/render_yellow.log 2>&1 &
PID_YELLOW=$!
echo "   Started Green Manthey (PID: $PID_YELLOW)"

# wait $PID_WHITE
# echo "   ✅ White 911 Render Complete"
wait $PID_YELLOW
echo "   ✅ Green Manthey Render Complete"

# 2. UPLOAD
echo "☁️ [2/3] Uploading to Firebase..."
if node $UPLOAD_SCRIPT; then
    echo "   ✅ Upload Success"
else
    echo "   ❌ Upload Failed"
    exit 1
fi

# 3. SYNC
echo "🔄 [3/3] Syncing App Variants..."
if node $SYNC_SCRIPT; then
    echo "   ✅ Sync Success"
else
    echo "   ❌ Sync Failed"
    exit 1
fi

echo "==============================================="
echo "🎉 Pipeline Complete! Check the website."
