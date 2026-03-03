#!/bin/bash
set -e
JOB_ID=$1
if [ -z "$JOB_ID" ]; then
  echo "Usage: ./workers/proxy_anchor_worker.sh <jobId>"
  exit 1
fi

JOB_DIR="./jobs/$JOB_ID"
PROXY_DIR="$JOB_DIR/proxy"

echo "Generating proxy and anchors..."
cat <<EOF > "$PROXY_DIR/anchors.json"
{
  "contract": "GARAGE_ANCHORS_V1",
  "wheel_hubs": [
    {"id": "fl", "position": [-1.0, 0.3, 1.5]},
    {"id": "fr", "position": [1.0, 0.3, 1.5]},
    {"id": "rl", "position": [-1.0, 0.3, -1.5]},
    {"id": "rr", "position": [1.0, 0.3, -1.5]}
  ]
}
EOF

if [ "$REAL_MODE" = "1" ]; then
  echo "Regenerating high-fidelity proxy from COLMAP points..."
  
  POINTS_TXT="$JOB_DIR/colmap/sparse/0/points3D.txt"
  POINTS_BIN="$JOB_DIR/colmap/sparse/0/points3D.bin"
  
  if [ ! -f "$POINTS_TXT" ] && [ -f "$POINTS_BIN" ]; then
    echo "Found binary model, converting to TXT for mesh generation..."
    colmap model_converter \
      --input_path "$JOB_DIR/colmap/sparse/0" \
      --output_path "$JOB_DIR/colmap/sparse/0" \
      --output_type TXT
  fi
  
  POINTS_PLY="$JOB_DIR/colmap/points3D.ply"
  
  if [ -f "$POINTS_PLY" ]; then
    ./venv/bin/python3 ./workers/scripts/proxy_mesh_gen.py "$POINTS_PLY" "$PROXY_DIR/proxy.glb"
    
    # Assert size check (>= 3KB)
    PROXY_SIZE=$(stat -f%z "$PROXY_DIR/proxy.glb")
    if [ "$PROXY_SIZE" -lt 3072 ]; then
       echo "ERROR: proxy.glb is too small (${PROXY_SIZE} bytes). Generation failed robustness check."
       exit 1
    fi
    echo "SUCCESS: proxy.glb generated (${PROXY_SIZE} bytes)."
  else
    echo "ERROR: No points3D.ply found for proxy generation."
    exit 1
  fi
else
  echo "MOCK_MODE: Creating stubbed proxy.glb"
  touch "$PROXY_DIR/proxy.glb"
fi
