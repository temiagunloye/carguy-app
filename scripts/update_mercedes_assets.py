import shutil
import os

artifact_dir = "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56"
dest_dir = "/Users/temiagunloye/Desktop/carguy-app/website/public/assets/cars/mercedes_c63"

# Source Mapping
mapping = {
    "angle_01.png": "mercedes_angle_1_1770305425889.png",
    "angle_02.png": "mercedes_angle_2_1770305492390.png", 
    "angle_03.png": "angle_03.png", # Fallback to existing artifact if no new one found
    "angle_04.png": "mercedes_c63_angle_04_v1_1770274375113.png",
    "angle_05.png": "mercedes_c63_angle_05_1770275945796.png",
    "angle_06.png": "mercedes_c63_angle_06_1770304455243.png",
    "angle_07.png": "mercedes_c63_angle_07_1770304469384.png",
    "angle_08.png": "mercedes_c63_angle_08_1770304484036.png",
    "angle_09.png": "mercedes_c63_angle_09_1770304498140.png",
    "angle_10.png": "mercedes_c63_angle_10_1770304512792.png"
}

# Check for better Angle 3 match
# I'll check if there is a 'mercedes_angle_3' or similar
for f in os.listdir(artifact_dir):
    if "mercedes" in f and "angle_3" in f:
        print(f"Found better candidate for angle 3: {f}")
        # mapping["angle_03.png"] = f # Uncomment if found? No, I'll decide manually or logic here
    if "mercedes" in f and "angle_03" in f:
        print(f"Found better candidate for angle 03: {f}")
        mapping["angle_03.png"] = f

print("Starting update...")
if not os.path.exists(dest_dir):
    os.makedirs(dest_dir)

for dest_name, src_name in mapping.items():
    src_path = os.path.join(artifact_dir, src_name)
    dest_path = os.path.join(dest_dir, dest_name)
    
    if os.path.exists(src_path):
        print(f"Copying {src_name} -> {dest_name}")
        shutil.copy2(src_path, dest_path)
    else:
        print(f"ERROR: Source file not found: {src_name}")

print("Update complete.")
