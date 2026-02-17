import os
import shutil
import glob
import re

# Configuration
BRAIN_DIR = "/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56"
ASSETS_DIR = "/Users/temiagunloye/Desktop/carguy-app/assets/cars"
PROD_RENDERS_DIR = "/Users/temiagunloye/Desktop/carguy-app/production_renders"

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def copy_and_rename(src_pattern, dest_dir, prefix_strip_regex):
    ensure_dir(dest_dir)
    files = glob.glob(src_pattern)
    print(f"Found {len(files)} files for pattern: {src_pattern}")
    
    for src in files:
        basename = os.path.basename(src)
        # Extract angle number using regex
        match = re.search(r'angle_(\d+)', basename)
        if match:
            angle_num = match.group(1)
            new_name = f"angle_{angle_num}.png"
            dest = os.path.join(dest_dir, new_name)
            shutil.copy2(src, dest)
            print(f"Deployed: {new_name} -> {dest_dir}")
        else:
            print(f"Skipping (no angle found): {basename}")

def main():
    print("🚀 Starting Deployment...")

    # 1. Audi RS6 Custom (From Brain)
    print("\n📦 Deploying Audi RS6 Custom...")
    audi_src = os.path.join(BRAIN_DIR, "audi_rs6_angle_*.png")
    copy_and_rename(audi_src, os.path.join(ASSETS_DIR, "audi_rs6"), r"audi_rs6_")

    # 2. Subaru BRZ Custom (From Wrong 'Stock' Folder into 'Custom')
    print("\n📦 Moving BRZ Custom (cleaning up)...")
    brz_src = os.path.join(ASSETS_DIR, "subaru_brz_stock", "*angle_*.png")
    copy_and_rename(brz_src, os.path.join(ASSETS_DIR, "subaru_brz_custom"), r"brz_stock_")
    
    # 3. Porsche Manthey (From Production Renders)
    print("\n📦 Deploying Porsche Manthey...")
    manthey_src = os.path.join(PROD_RENDERS_DIR, "porsche_manthey", "angle_*.png")
    copy_and_rename(manthey_src, os.path.join(ASSETS_DIR, "porsche_manthey"), r"")

    print("\n✅ Deployment script finished.")

if __name__ == "__main__":
    main()
