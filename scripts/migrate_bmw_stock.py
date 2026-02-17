import shutil
import os
import glob

# Configuration
artifact_dir = "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56"
dest_dir = "/Users/temiagunloye/Desktop/carguy-app/website/public/assets/cars/bmw_m3_stock"

# Patterns to match generated stock images
# Format: bmw_m3_stock_angle_XX_timestamp.png
patterns = {
    "angle_01": "bmw_m3_stock_angle_01_*.png",
    "angle_02": "bmw_m3_stock_angle_02_*.png",
    "angle_03": "bmw_m3_stock_angle_03_*.png",
    "angle_04": "bmw_m3_stock_angle_04_*.png",
    "angle_05": "bmw_m3_stock_angle_05_*.png",
    "angle_06": "bmw_m3_stock_angle_06_*.png",
    "angle_07": "bmw_m3_stock_angle_07_*.png",
    "angle_08": "bmw_m3_stock_angle_08_*.png",
    "angle_09": "bmw_m3_stock_angle_09_*.png",
    "angle_10": "bmw_m3_stock_angle_10_*.png"
}

print(f"Migrating assets to {dest_dir}...")

for angle_name, pattern in patterns.items():
    search_path = os.path.join(artifact_dir, pattern)
    matches = glob.glob(search_path)
    
    if matches:
        # Sort by modification time to get the latest one if multiple exist
        latest_file = max(matches, key=os.path.getmtime)
        dest_path = os.path.join(dest_dir, f"{angle_name}.png")
        shutil.copy2(latest_file, dest_path)
        print(f"✅ Copied {os.path.basename(latest_file)} -> {angle_name}.png")
    else:
        print(f"❌ Could not find artifact for {angle_name}")

print("Migration complete.")
