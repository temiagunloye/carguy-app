#!/bin/bash
# scripts/run_viewer.sh - Launch local 3D viewer for the latest pipeline job

if [ ! -z "$1" ]; then
  if [[ "$1" == *"model_manifest.json" ]]; then
    LATEST_JOB_PATH=$(dirname $(dirname "$1"))
  else
    LATEST_JOB_PATH="$1"
  fi
else
  LATEST_JOB_PATH=$(ls -td jobs/job_smoke_* 2>/dev/null | head -n 1)
fi

if [ -z "$LATEST_JOB_PATH" ] || [ ! -d "$LATEST_JOB_PATH" ]; then
  echo "Job path not found: $LATEST_JOB_PATH"
  exit 1
fi

LATEST_JOB_ID=$(basename "$LATEST_JOB_PATH")

echo "============================================="
echo "PREPARING VIEWER FOR: $LATEST_JOB_ID"
echo "============================================="

# Create config for web app
cat <<EOF > "services/viewer/latest_job.json"
{
  "id": "$LATEST_JOB_ID",
  "path": "$LATEST_JOB_PATH"
}
EOF

echo "Starting local web server on http://localhost:8000"
echo "Viewer will be available at: http://localhost:8000/services/viewer/index.html"
echo "Press Ctrl+C to stop."
echo ""

# Start server from root so it can access ./jobs/
python3 -m http.server 8000
