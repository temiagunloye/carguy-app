#!/bin/bash
set -e
JOB_ID=$1
if [ -z "$JOB_ID" ]; then
  echo "Usage: ./workers/segmentation_worker.sh <jobId>"
  exit 1
fi

echo "Running Python segmentation worker logic..."

# Ensure we use the workspace's venv mapped in pipeline_prototype
if [ -d "pipeline_prototype/venv" ]; then
  PYTHON_EXEC="pipeline_prototype/venv/bin/python3"
elif [ -d "venv" ]; then
  PYTHON_EXEC="venv/bin/python3"
else
  echo "WARN: No local venv found. Falling back to system python3."
  PYTHON_EXEC="python3"
fi

$PYTHON_EXEC workers/segmentation_worker.py "$JOB_ID"
