#!/bin/bash
# scripts/inspect_latest_job.sh - Quality inspection for REAL_MODE jobs

LATEST_JOB=$(ls -td ./jobs/job_smoke_* 2>/dev/null | head -n 1)

if [ -z "$LATEST_JOB" ]; then
  echo "No smoke test jobs found in ./jobs/"
  exit 1
fi

echo "============================================="
echo "INSPECTING LATEST JOB: $(basename "$LATEST_JOB")"
echo "Path: $LATEST_JOB"
echo "============================================="

# 1. Input Check
RAW_FRAMES=$(ls "$LATEST_JOB/frames/raw" 2>/dev/null | wc -l)
SELECTED_FRAMES=$(ls "$LATEST_JOB/frames/selected" 2>/dev/null | wc -l)
echo "Frames extracted: $RAW_FRAMES"
echo "Frames selected:  $SELECTED_FRAMES"

# 2. COLMAP Check
if [ -f "$LATEST_JOB/colmap/poses.json" ]; then
  POSES_COUNT=$(grep -c "\"id\":" "$LATEST_JOB/colmap/poses.json" || echo "0")
  echo "Registered poses: $POSES_COUNT"
else
  echo "Registered poses: MISSING"
fi

if [ -f "$LATEST_JOB/colmap/points3D.ply" ]; then
  POINTS_SIZE=$(du -h "$LATEST_JOB/colmap/points3D.ply" | cut -f1)
  echo "Point cloud size: $POINTS_SIZE"
else
  echo "Point cloud size: MISSING"
fi

# 3. Proxy Check
if [ -f "$LATEST_JOB/proxy/proxy.glb" ]; then
  PROXY_SIZE=$(du -h "$LATEST_JOB/proxy/proxy.glb" | cut -f1)
  echo "Proxy Mesh size:  $PROXY_SIZE"
else
  echo "Proxy Mesh size:  MISSING"
fi

# 4. Manifest Check
if [ -f "$LATEST_JOB/package/model_manifest.json" ]; then
  STATUS=$(grep "\"status\":" "$LATEST_JOB/package/model_manifest.json" | cut -d'"' -f4)
  echo "Manifest status:  $STATUS"
else
  echo "Manifest:        MISSING"
fi

echo "============================================="
