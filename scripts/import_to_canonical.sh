#!/bin/bash
set -e

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: $0 <buildId> <sourceDir>"
    exit 1
fi

BUILD_ID="$1"
SOURCE_DIR="$2"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CANONICAL="$REPO_ROOT/assets/cars/$BUILD_ID"

echo "📥 Importing renders for $BUILD_ID"

if [ ! -d "$SOURCE_DIR" ]; then
    echo "❌ Source directory does not exist"
    exit 1
fi

mkdir -p "$CANONICAL"

map_angle() {
    local b=$(echo "$1" | tr '[:upper:]' '[:lower:]')
    
    if echo "$b" | grep -qiE "driver.*front.*3|front.*3.*driver"; then echo "01"
    elif echo "$b" | grep -qiE "passenger.*front.*3|front.*3.*passenger"; then echo "02"
    elif echo "$b" | grep -qiE "driver.*side|side.*driver"; then echo "03"
    elif echo "$b" | grep -qiE "passenger.*side|side.*passenger"; then echo "04"
    elif echo "$b" | grep -qiE "driver.*rear.*3|rear.*3.*driver"; then echo "05"
    elif echo "$b" | grep -qiE "passenger.*rear.*3|rear.*3.*passenger"; then echo "06"
    elif echo "$b" | grep -qiE "front.*center|center.*front"; then echo "07"
    elif echo "$b" | grep -qiE "rear.*center|center.*rear"; then echo "08"
    elif echo "$b" | grep -qiE "high.*front"; then echo "09"
    elif echo "$b" | grep -qiE "high.*rear"; then echo "10"
    else echo ""
    fi
}

for file in "$SOURCE_DIR"/*.{png,jpg,webp} 2>/dev/null; do
    [ -f "$file" ] || continue
    
    ANGLE_NUM=$(map_angle "$(basename "$file")")
    
    if [ -n "$ANGLE_NUM" ]; then
        DEST="$CANONICAL/angle_$ANGLE_NUM.png"
        
        if [ ! -f "$DEST" ]; then
            cp "$file" "$DEST"
            echo "  ✓ angle_$ANGLE_NUM.png (keyword)"
        fi
    fi
done

FILES=$(find "$SOURCE_DIR" -maxdepth 1 \( -name "*.png" -o -name "*.jpg" -o -name "*.webp" \) -type f | \
        xargs ls -t 2>/dev/null | head -10)

COUNT=0
for file in $FILES; do
    COUNT=$((COUNT + 1))
    ANGLE_NUM=$(printf "%02d" $COUNT)
    DEST="$CANONICAL/angle_$ANGLE_NUM.png"
    
    if [ -f "$DEST" ]; then
        continue
    fi
    
    cp "$file" "$DEST"
    echo "  ✓ angle_$ANGLE_NUM.png (fallback)"
done

TOTAL=$(ls -1 "$CANONICAL"/angle_*.png 2>/dev/null | wc -l | tr -d ' ')
echo "✅ $TOTAL/10 angles"
