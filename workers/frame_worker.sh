#!/bin/bash
set -e
JOB_ID=$1
if [ -z "$JOB_ID" ]; then
  echo "Usage: ./workers/frame_worker.sh <jobId>"
  exit 1
fi

JOB_DIR="./jobs/$JOB_ID"
INPUT_VIDEO="$JOB_DIR/input/capture.mp4"
RAW_DIR="$JOB_DIR/frames/raw"
SELECTED_DIR="$JOB_DIR/frames/selected"

echo "Extracting frames using ffmpeg..."
if [ ! -f "$INPUT_VIDEO" ]; then
  echo "Video not found at "$INPUT_VIDEO""
  exit 1
fi

# Extract frames (downscaled and JPG for high performance)
if [ "$REAL_MODE" = "1" ]; then
  echo "REAL_MODE: Extracting frames with 1600px limit (JPG)..."
  ffmpeg -y -i "$INPUT_VIDEO" -vf "fps=5,scale='min(1600,iw)':-1" -q:v 2 "$RAW_DIR/raw_%04d.jpg"
else
  ffmpeg -y -i "$INPUT_VIDEO" -vf "fps=5" "$RAW_DIR/raw_%04d.jpg"
fi

echo "Selecting frames..."

if [ "$REAL_MODE" = "1" ]; then
  MAX_FRAMES=80
  TOTAL_RAW=$(ls -1 "$RAW_DIR"/*.jpg 2>/dev/null | wc -l)
  
  if [ "$TOTAL_RAW" -gt "$MAX_FRAMES" ]; then
    echo "Downsampling "$TOTAL_RAW" frames to "$MAX_FRAMES" limit..."
    STEP=$(( TOTAL_RAW / MAX_FRAMES ))
    if [ "$STEP" -lt 1 ]; then STEP=1; fi
    
    COUNT=0
    i=0
    for f in "$RAW_DIR"/*.jpg; do
      if (( i % STEP == 0 )) && [ "$COUNT" -lt "$MAX_FRAMES" ]; then
        cp "$f" "$SELECTED_DIR/"
        ((COUNT++))
      fi
      ((i++))
    done
    echo "Selected "$COUNT" frames."
  else
    echo "Copying all "$TOTAL_RAW" frames (below limit)."
    cp "$RAW_DIR"/*.jpg "$SELECTED_DIR"/
  fi
else
  echo "MOCK_MODE: Copying mock frames."
  cp "$RAW_DIR"/*.jpg "$SELECTED_DIR"/
fi

echo "Frame selection complete."
