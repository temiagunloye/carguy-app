#!/bin/bash
set -e

JOB_ID=$1
STAGE_NAME=$2

if [ -z "$JOB_ID" ] || [ -z "$STAGE_NAME" ]; then
  echo "Usage: ./run_stage.sh <jobId> <stage>"
  exit 1
fi

WORKER_SCRIPT="./workers/${STAGE_NAME}.sh"
if [ ! -f "$WORKER_SCRIPT" ]; then
  echo "Error: Worker script $WORKER_SCRIPT does not exist."
  exit 1
fi

LOG_FILE="./jobs/$JOB_ID/logs/stages.log"
mkdir -p "$(dirname "$LOG_FILE")"

chmod +x "$WORKER_SCRIPT"
echo "[STAGED] Starting $STAGE_NAME for $JOB_ID at $(date)" | tee -a "$LOG_FILE"
# Run worker and tee output to log, preserving exit code
"$WORKER_SCRIPT" "$JOB_ID" 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -ne 0 ]; then
  echo "[FAILED] $STAGE_NAME exited with code $EXIT_CODE" | tee -a "$LOG_FILE"
  exit $EXIT_CODE
fi

echo "[SUCCESS] $STAGE_NAME completed at $(date)" | tee -a "$LOG_FILE"
