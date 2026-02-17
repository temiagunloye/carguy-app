#!/bin/bash

# scripts/import_to_canonical.sh
# Usage: ./scripts/import_to_canonical.sh <buildId> <sourceFile> <angleKey>

BUILD_ID=$1
SOURCE_FILE=$2
ANGLE_KEY=$3

if [ -z "$BUILD_ID" ] || [ -z "$SOURCE_FILE" ]; then
  echo "Usage: $0 <buildId> <sourceFile> [angleKey]"
  exit 1
fi

# Define Canonical Path
TARGET_DIR="website/assets/cars/$BUILD_ID"
mkdir -p "$TARGET_DIR"

# If angleKey is not provided, try to extract it from filename
if [ -z "$ANGLE_KEY" ]; then
  # Try to find angle_XX in filename
  if [[ "$SOURCE_FILE" =~ (angle_[0-9]{2}) ]]; then
    ANGLE_KEY="${BASH_REMATCH[1]}"
  else
    echo "Error: Could not determine angle key from filename and none provided."
    exit 1
  fi
fi

TARGET_FILE="$TARGET_DIR/$ANGLE_KEY.png"

echo "📦 Importing $SOURCE_FILE -> $TARGET_FILE"
cp "$SOURCE_FILE" "$TARGET_FILE"

# Verify
if [ -f "$TARGET_FILE" ]; then
  echo "✅ Import successful: $TARGET_FILE"
else
  echo "❌ Import failed!"
  exit 1
fi
