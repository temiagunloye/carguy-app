#!/bin/bash
# scripts/cleanup_jobs.sh - Manually clear all smoke test jobs

read -p "Are you sure you want to delete all ./jobs/job_smoke_* directories? (y/N): " confirm
if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
  echo "Cleaning up jobs..."
  rm -rf ./jobs/job_smoke_*
  echo "Done."
else
  echo "Cleanup cancelled."
fi
