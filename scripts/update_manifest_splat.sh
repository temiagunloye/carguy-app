#!/bin/bash
set -e
JOB_ID=$1
if [ -z "$JOB_ID" ]; then
  echo "Usage: ./scripts/update_manifest_splat.sh <jobId>"
  exit 1
fi

JOB_DIR="jobs/$JOB_ID"
SPLAT_DIR="$JOB_DIR/splat/model"
MANIFEST="$JOB_DIR/package/model_manifest.json"

if [ ! -f "$MANIFEST" ]; then
  echo "Manifest $MANIFEST does not exist."
  exit 1
fi

python3 -c "
import os, json, sys

manifest_path = '$MANIFEST'
splat_dir = '$SPLAT_DIR'

with open(manifest_path, 'r') as f:
    data = json.load(f)

artifact_path = None
artifact_size = 0

if os.path.exists(splat_dir):
    for root, dirs, files in os.walk(splat_dir):
        for file in files:
            path = os.path.join(root, file)
            size = os.path.getsize(path)
            if size > 1_000_000:
                artifact_path = path
                artifact_size = size
                break
        if artifact_path:
            break

if artifact_path:
    # use relative path for manifest (e.g. from the final web server root)
    # The current manifest structure references relative to the root like:
    data['splat'] = {
        'exists': True,
        'artifactPath': artifact_path,
        'sizeBytes': artifact_size,
        'viewerUrl': 'http://localhost:7007'
    }
else:
    data['splat'] = { 'exists': False }

with open(manifest_path, 'w') as f:
    json.dump(data, f, indent=4)

print('Manifest updated successfully.')
"
