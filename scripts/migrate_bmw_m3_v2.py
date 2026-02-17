import shutil
import os

# Configuration
artifact_dir = "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56"
dest_dir = "/Users/temiagunloye/Desktop/carguy-app/website/public/assets/cars/bmw_m3_custom"

# Ensure destination exists
if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)
    print(f"Created directory: {dest_dir}")

# Map artifacts to destination filenames
mapping = {
    "bmw_m3_custom_angle_01_retry_1770308743572.png": "angle_01.png",
    "bmw_m3_custom_angle_02_retry_1770308760361.png": "angle_02.png",
    "bmw_m3_custom_angle_03_retry_1770308779127.png": "angle_03.png",
    "bmw_m3_custom_angle_04_retry_1770308804632.png": "angle_04.png",
    "bmw_m3_custom_angle_05_retry_1770308825099.png": "angle_05.png",
    "bmw_m3_custom_angle_06_1770308942113.png":       "angle_06.png",
    "bmw_m3_custom_angle_07_1770308960171.png":       "angle_07.png",
    "bmw_m3_custom_angle_08_1770308998651.png":       "angle_08.png",
    "bmw_m3_custom_angle_09_1770309016694.png":       "angle_09.png"
}

# Copy Files
print("Copying rendered assets...")
for src_name, dest_name in mapping.items():
    src_path = os.path.join(artifact_dir, src_name)
    dest_path = os.path.join(dest_dir, dest_name)
    
    if os.path.exists(src_path):
        shutil.copy2(src_path, dest_path)
        print(f"✅ Copied {src_name} -> {dest_name}")
    else:
        print(f"❌ Missing artifact: {src_name}")

# Duplicate Angle 09 as Angle 10 (Temporary Placeholder)
# This avoids needing PIL to create a black image
print("Duplicating Angle 09 as Angle 10 placeholder...")
src_placeholder = os.path.join(dest_dir, "angle_09.png")
dest_placeholder = os.path.join(dest_dir, "angle_10.png")

if os.path.exists(src_placeholder):
    shutil.copy2(src_placeholder, dest_placeholder)
    print("✅ Created placeholder angle_10.png (Copy of Angle 09)")
else:
    print("❌ Could not create placeholder, Angle 09 missing.")

print("Migration complete.")
