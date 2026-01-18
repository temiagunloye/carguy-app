#!/bin/bash
# Quick optimization runner

echo "🚀 Starting model optimization..."
echo "This will take 2-5 minutes per model"
echo ""

# Check if Blender is installed
if [ ! -f "/Applications/Blender.app/Contents/MacOS/Blender" ]; then
    echo "❌ Blender not found!"
    echo "Make sure Blender is installed in /Applications/"
    exit 1
fi

# Run Blender in background mode with optimization script
/Applications/Blender.app/Contents/MacOS/Blender \
    --background \
    --python optimize_models.py

echo ""
echo "✅ Done! Check the output above for results."
