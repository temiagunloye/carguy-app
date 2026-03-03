#!/bin/bash
# scripts/tail_latest_job.sh - Tail the stages.log of the most recent job

LATEST_JOB=$(ls -td ./jobs/job_smoke_* 2>/dev/null | head -n 1)

if [ -z "$LATEST_JOB" ]; then
  echo "No smoke test jobs found."
  exit 1
fi

LOG_FILE="$LATEST_JOB/logs/stages.log"

if [ ! -f "$LOG_FILE" ]; then
  echo "Latest job $(basename "$LATEST_JOB") has no stages.log yet."
  # Try to wait or just exit
  exit 1
fi

echo "Tailing log for $(basename "$LATEST_JOB")..."
tail -f "$LOG_FILE"
