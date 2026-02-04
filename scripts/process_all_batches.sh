#!/bin/bash
# Process all batches in renders/batch_01

BASE_DIR="renders/batch_01"
DEST_DIR="tmp/final-renders"

mkdir -p "$DEST_DIR"

source venv/bin/activate

for dir in "$BASE_DIR"/*/; do
    dir=${dir%*/}      # remove the trailing "/"
    name=$(basename "$dir")
    echo "🚗 Processing Custom Build: $name"
    
    # Create dest
    mkdir -p "$DEST_DIR/$name"
    
    # Run Python Processor
    python scripts/process_sleek_studio.py "$dir" "$DEST_DIR/$name"
done

echo "✅ All custom builds processed."
