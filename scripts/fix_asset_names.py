
import os
import shutil

# Mapping for semantic names to angle_XX
mapping = {
    "driver_front.png": "angle_01.png",
    "passenger_front.png": "angle_02.png",
    "driver_rear.png": "angle_03.png",
    "passenger_rear.png": "angle_04.png",
    "front_center.png": "angle_05.png",
    "rear_center.png": "angle_06.png",
    "full_driver_side.png": "angle_07.png",
    "full_passenger_side.png": "angle_08.png",
    "front_low.png": "angle_09.png",
    "rear_low.png": "angle_10.png"
}

def rename_assets(directory):
    if not os.path.exists(directory):
        print(f"Directory not found: {directory}")
        return

    print(f"Renaming assets in {directory}...")
    for filename in os.listdir(directory):
        if filename in mapping:
            src = os.path.join(directory, filename)
            dst = os.path.join(directory, mapping[filename])
            shutil.move(src, dst)
            print(f"Renamed {filename} -> {mapping[filename]}")

# Rename Mercedes C63 assets (Stock)
rename_assets("website/public/assets/cars/mercedes_c63")
