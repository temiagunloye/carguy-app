#!/bin/bash
JOB_ID=$1
ITERATIONS=${2:-5000}

if [ -z "$JOB_ID" ]; then
  echo "Usage: ./scripts/train_splat_job.sh <jobId> [iterations]"
  exit 1
fi

if [ -d "venv" ]; then
  source venv/bin/activate
fi

python3 workers/splat_train_worker/train.py "$JOB_ID" "$ITERATIONS"
