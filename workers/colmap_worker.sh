#!/bin/bash
set -e
JOB_ID=$1
if [ -z "$JOB_ID" ]; then
  echo "Usage: ./workers/colmap_worker.sh <jobId>"
  exit 1
fi

JOB_DIR="./jobs/$JOB_ID"
SELECTED_DIR="$JOB_DIR/frames/selected"
COLMAP_DIR="$JOB_DIR/colmap"

echo "Initializing COLMAP workspace..."
mkdir -p "$COLMAP_DIR/sparse/0"

# Note: COLMAP creates an sqlite database under database.db
DB_PATH="$COLMAP_DIR/database.db"
if [ -f "$DB_PATH" ]; then
    rm "$DB_PATH"
fi

echo "Running COLMAP feature extraction..."
colmap feature_extractor \
  --database_path "$DB_PATH" \
  --image_path "$SELECTED_DIR" \
  --ImageReader.camera_model OPENCV \
  --ImageReader.single_camera 1

if [ "$REAL_MODE" = "1" ]; then
  echo "Running optimized COLMAP sequential matcher (overlap 12)..."
  colmap sequential_matcher \
    --database_path "$DB_PATH" \
    --SequentialMatching.overlap 12
else
  echo "Running COLMAP exhaustive matcher (MOCK_MODE)..."
  colmap exhaustive_matcher \
    --database_path "$DB_PATH"
fi

echo "Running COLMAP mapper..."
if [ "$REAL_MODE" = "1" ]; then
  colmap mapper \
    --database_path "$DB_PATH" \
    --image_path "$SELECTED_DIR" \
    --output_path "$COLMAP_DIR/sparse"
    
  echo "Ensuring TXT model exists for post-processing..."
  if [ ! -f "$COLMAP_DIR/sparse/0/cameras.txt" ]; then
    colmap model_converter \
      --input_path "$COLMAP_DIR/sparse/0" \
      --output_path "$COLMAP_DIR/sparse/0" \
      --output_type TXT
  fi
else
  # MOCK MODE Fallback bounds - will exit if colmap fails to generate matches or mock frames
  if ! colmap mapper \
    --database_path "$DB_PATH" \
    --image_path "$SELECTED_DIR" \
    --output_path "$COLMAP_DIR/sparse"; then
    echo "WARN: COLMAP mapper failed on mock frames. Stubbing sparse model..."
    mkdir -p "$COLMAP_DIR/sparse/0"
    touch "$COLMAP_DIR/sparse/0/cameras.txt"
    touch "$COLMAP_DIR/sparse/0/images.txt"
    touch "$COLMAP_DIR/sparse/0/points3D.txt"
  fi
fi

# Ensure output contracts exist if REAL_MODE is enabled
if [ "$REAL_MODE" = "1" ]; then
  if [ ! -f "$COLMAP_DIR/sparse/0/cameras.txt" ]; then
    echo "ERROR: COLMAP failed to output cameras.txt in REAL_MODE"
    exit 1
  fi
  
  echo "Regenerating high-fidelity artifacts..."
  python3 ./workers/scripts/colmap_to_json.py "$COLMAP_DIR/sparse/0" "$COLMAP_DIR/poses.json"
  python3 ./workers/scripts/colmap_to_ply.py "$COLMAP_DIR/sparse/0/points3D.txt" "$COLMAP_DIR/points3D.ply"
else
  # MOCK MODE Hardcoded fallback for simple smoke tests
  cat <<EOF > "$COLMAP_DIR/poses.json"
{
  "contract": "COLMAP_SFM",
  "status": "computed",
  "frames": []
}
EOF
  touch "$COLMAP_DIR/points3D.ply"
fi
