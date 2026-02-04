#!/bin/bash
set -e

echo "🚀 Starting Full Fleet Render Regeneration (1.0x Zoom - Uncropped)"

# 1. Porsche 911 (White)
echo "📸 Processing Porsche 911..."
python3 scripts/smart_crop_split.py "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56/porsche_911_white_dark_studio_super_wide_set_1769632782180.png" "tmp/final_staging/porsche_911"

# 2. BMW M3 (Red)
echo "📸 Processing BMW M3..."
python3 scripts/smart_crop_split.py "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56/bmw_m3_dark_studio_super_wide_set_1769632911988.png" "tmp/final_staging/bmw_m3"

# 3. Audi RS6 (Grey)
echo "📸 Processing Audi RS6..."
python3 scripts/smart_crop_split.py "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56/audi_rs6_dark_studio_wide_set_1769629543719.png" "tmp/final_staging/audi_rs6"

# 4. Mercedes C63 (Matte Coal)
echo "📸 Processing Mercedes C63..."
python3 scripts/smart_crop_split.py "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56/mercedes_c63_dark_studio_wide_set_1769629560989.png" "tmp/final_staging/mercedes_c63"

# 5. Subaru BRZ (Black/tS)
echo "📸 Processing Subaru BRZ..."
python3 scripts/smart_crop_split.py "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56/subaru_brz_dark_studio_wide_set_1769629576074.png" "tmp/final_staging/subaru_brz"

# 6. Porsche 911 Manthey (Yellow)
echo "📸 Processing Porsche 911 Manthey..."
python3 scripts/smart_crop_split.py "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56/porsche_911_manthey_super_wide_set_retry_1769633053148.png" "tmp/final_staging/porsche_911_manthey"

# 7. Mercedes C63 Rohana (Silver)
echo "📸 Processing Mercedes C63 Rohana..."
python3 scripts/smart_crop_split.py "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56/mercedes_c63_grid_1769630869640.png" "tmp/final_staging/mercedes_c63_rohana"

# 8. Subaru BRZ TE37 (Bronze)
echo "📸 Processing Subaru BRZ TE37..."
python3 scripts/smart_crop_split.py "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56/subaru_brz_te37_dark_studio_wide_set_1769629602992.png" "tmp/final_staging/subaru_brz_te37"

echo "✅ All renders regenerated successfully in tmp/final_staging"
