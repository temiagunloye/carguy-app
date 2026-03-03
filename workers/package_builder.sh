#!/bin/bash
set -e
JOB_ID=$1
if [ -z "$JOB_ID" ]; then
  echo "Usage: ./workers/package_builder.sh <jobId>"
  exit 1
fi

JOB_DIR="./jobs/$JOB_ID"
PACKAGE_DIR="$JOB_DIR/package"

echo "Building package manifest..."
mkdir -p "$PACKAGE_DIR/thumbs"
FIRST_FRAME=$(ls "$JOB_DIR/frames/selected" | head -n 1 || echo "")
if [ -n "$FIRST_FRAME" ]; then
  # Determine extension
  EXT="${FIRST_FRAME##*.}"
  cp "$JOB_DIR/frames/selected/$FIRST_FRAME" "$PACKAGE_DIR/thumbs/preview.$EXT" || true
fi

# We use the assets mapped by the reality twin stub
ASSETS=$(ls "$JOB_DIR/reality/turntable" 2>/dev/null | sed 's/^/"turntable\//; s/$/"/' | paste -sd, - || echo "")

cat <<EOF > "$PACKAGE_DIR/model_manifest.json"
{
  "jobId": "${JOB_ID}",
  "status": "READY",
  "realityTwin": {
    "type": "turntable",
    "assets": [ $ASSETS ]
  },
  "proxy": {
    "glbPath": "proxy/proxy.glb",
    "anchorsPath": "proxy/anchors.json"
  },
  "colmap": {
    "posesPath": "colmap/poses.json",
    "sparsePath": "colmap/sparse",
    "pointsPath": "colmap/points3D.ply"
  },
  "frames": {
    "previewPaths": [
      "thumbs/preview.${EXT:-png}"
    ]
  },
  "carId": "unknown",
  "quality": {
    "blurScore": 95,
    "exposureScore": 88,
    "warnings": []
  },
  "buildDefaults": {
    "wrap": {
      "colorHex": "#000000",
      "finish": "gloss"
    },
    "tint": {
      "vlt": 35
    }
  }
}
EOF
echo "Built model_manifest.json"
