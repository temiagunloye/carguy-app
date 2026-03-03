#!/bin/bash
set -e
JOB_ID=$1
if [ -z "$JOB_ID" ]; then
  echo "Usage: ./workers/reality_twin_worker.sh <jobId>"
  exit 1
fi

JOB_DIR="./jobs/$JOB_ID"
REALITY_DIR="$JOB_DIR/reality"

echo "Generating Reality Twin (Turntable Stub)..."
cp -r "$JOB_DIR/frames/selected/"* "$REALITY_DIR/turntable/" 2>/dev/null || true

# Just list the first few frames for the stub asset list
ASSETS=$(ls "$REALITY_DIR/turntable/" | sed 's/^/"turntable\//; s/$/"/' | paste -sd, -)

cat <<EOF > "$REALITY_DIR/reality_twin.json"
{
  "type": "turntable",
  "assets": [ $ASSETS ]
}
EOF
