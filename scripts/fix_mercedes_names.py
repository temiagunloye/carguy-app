
import os
import shutil

target_dir = "/Users/temiagunloye/Desktop/carguy-app/website/public/assets/cars/mercedes_c63"

mapping = {
    "driver_front.png": "angle_01.png",
    "front_center.png": "angle_02.png",
    "passenger_front.png": "angle_03.png",
    "full_passenger_side.png": "angle_04.png",
    "passenger_rear.png": "angle_05.png",
    "rear_center.png": "angle_06.png",
    # Adding extra mappings if they exist in semantic naming but absent from the precise list, just in case
    "full_driver_side.png": "angle_07.png", # Guessing
    "driver_rear.png": "angle_08.png", # Guessing
    "front_low.png": "angle_09.png", # Guessing
    "rear_low.png": "angle_10.png" # Guessing
}

print(f"Renaming files in {target_dir}...")

for filename in os.listdir(target_dir):
    if filename in mapping:
        src = os.path.join(target_dir, filename)
        dst = os.path.join(target_dir, mapping[filename])
        print(f"Renaming {filename} -> {mapping[filename]}")
        shutil.copy2(src, dst) # Copy instead of move to keep originals just in case
