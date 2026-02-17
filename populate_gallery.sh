#!/bin/bash
set -e

# 1. Create Public Verification Directory
DEST_DIR="website/public/assets/verify_all"
BACKUP_BASE="tmp/user_approved_renders/tmp/final-renders"

echo "Creating destination: $DEST_DIR"
rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

# Function to safely copy
safe_copy() {
    src="$1"
    dest="$2"
    name="$3"
    
    mkdir -p "$dest"
    
    if [ -d "$src" ]; then
        echo "Copying $name from $src..."
        cp "$src"/*.png "$dest/" 2>/dev/null || echo "No pngs in $src"
    else
        echo "WARNING: Source $src does not exist for $name"
    fi
}

# 2. Copy All Models
safe_copy "$BACKUP_BASE/subaru_brz_2024" "$DEST_DIR/brz_blue" "BRZ Blue"
safe_copy "$BACKUP_BASE/mercedes_c63_2024" "$DEST_DIR/merc_black" "Merc Black"
safe_copy "$BACKUP_BASE/bmw_m3_2024" "$DEST_DIR/m3_white" "M3 White"
safe_copy "$BACKUP_BASE/bmw_m3_2023_toronto_red" "$DEST_DIR/m3_red" "M3 Red"
safe_copy "$BACKUP_BASE/audi_rs6_2024_nardo_grey" "$DEST_DIR/rs6_grey" "RS6 Grey"
safe_copy "$BACKUP_BASE/audi_rs6_2024" "$DEST_DIR/rs6_blue" "RS6 Blue"
safe_copy "$BACKUP_BASE/porsche_911_2024" "$DEST_DIR/gt3_red" "GT3 Red"
safe_copy "$BACKUP_BASE/porsche_911_manthey" "$DEST_DIR/manthey_green" "Manthey Green"

echo "Done copying images."
