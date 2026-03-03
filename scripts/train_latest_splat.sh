#!/bin/bash
LATEST_JOB=$(ls -1d jobs/job_smoke_* 2>/dev/null | sort -r | head -n 1 | xargs basename)

if [ -z "$LATEST_JOB" ]; then
  echo "No job found."
  exit 1
fi

echo "Training latest job: $LATEST_JOB"
./scripts/train_splat_job.sh "$LATEST_JOB"
