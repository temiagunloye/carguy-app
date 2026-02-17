#!/bin/bash
set -e

if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
    echo "Usage: $0 <category> <partId> <sourceFileOrDir>"
    echo "Categories: wheels | wraps | other"
    exit 1
fi

CATEGORY="$1"
PART_ID="$2"
SOURCE="$3"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PARTS_ROOT="$REPO_ROOT/assets/parts"
DEST_DIR="$PARTS_ROOT/$CATEGORY/$PART_ID"
INDEX_FILE="$PARTS_ROOT/index.json"

if [[ ! "$CATEGORY" =~ ^(wheels|wraps|other)$ ]]; then
    echo "❌ Invalid category. Must be: wheels, wraps, or other"
    exit 1
fi

if [ ! -e "$SOURCE" ]; then
    echo "❌ Source does not exist: $SOURCE"
    exit 1
fi

mkdir -p "$DEST_DIR"

# Copy file(s)
if [ -f "$SOURCE" ]; then
    cp "$SOURCE" "$DEST_DIR/thumb.png"
    echo "  ✓ thumb.png"
elif [ -d "$SOURCE" ]; then
    if [ -f "$SOURCE/thumb.png" ]; then
        cp "$SOURCE/thumb.png" "$DEST_DIR/"
        echo "  ✓ thumb.png"
    fi
    if [ -f "$SOURCE/hero.png" ]; then
        cp "$SOURCE/hero.png" "$DEST_DIR/"
        echo "  ✓ hero.png"
    fi
else
    echo "❌ Invalid source"
    exit 1
fi

# Update index.json
node -e "
const fs = require('fs');
const index = JSON.parse(fs.readFileSync('$INDEX_FILE', 'utf8'));

const entry = {
    id: '$PART_ID',
    category: '$CATEGORY',
    thumbUrl: '/assets/parts/$CATEGORY/$PART_ID/thumb.png'
};

index['$CATEGORY'] = index['$CATEGORY'] || [];
const existing = index['$CATEGORY'].findIndex(p => p.id === '$PART_ID');

if (existing >= 0) {
    index['$CATEGORY'][existing] = entry;
} else {
    index['$CATEGORY'].push(entry);
}

fs.writeFileSync('$INDEX_FILE', JSON.stringify(index, null, 2));
console.log('✅ Updated index.json');
"

echo "✅ Part imported: $CATEGORY/$PART_ID"
