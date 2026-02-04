from PIL import Image
import sys

files = [
    "tmp/user_approved_renders/tmp/final-renders/porsche_911_2024_army_green/angle_09.jpg",
    "tmp/user_approved_renders/tmp/final-renders/porsche_911_2024_army_green/angle_10.jpg"
]

dest_dir = "tmp/production_staging/porsche_911_manthey/"

for f in files:
    try:
        img = Image.open(f).convert("RGBA")
        name = f.split('/')[-1].replace(".jpg", ".png")
        img.save(dest_dir + name)
        print(f"Recovered {name}")
    except Exception as e:
        print(f"Failed {f}: {e}")
