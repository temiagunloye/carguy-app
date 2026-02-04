import os
from pathlib import Path
from PIL import Image

BASE_DIR = Path("tmp/production_staging")

def sanitize_folder(folder_path):
    print(f"🧹 Sanitizing {folder_path.name}...")
    # Filter for image files
    files = sorted([f for f in os.listdir(folder_path) if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
    
    if not files:
        print(f"   ⚠️  No images found in {folder_path.name}")
        return

    # Sort files naturally if possible, or trust directory order
    files.sort()

    for i, filename in enumerate(files):
        file_path = folder_path / filename
        
        try:
            # 1. Open
            img = Image.open(file_path)
            
            # 2. Convert to RGBA
            if img.mode != 'RGBA':
                img = img.convert('RGBA')
            
            # 3. Define New Name (angle_01 ... angle_10 ... angle_N)
            # We map the i-th file to angle_{i+1}
            new_name = f"angle_{i+1:02d}.png"
            new_path = folder_path / new_name
            
            # 4. Save
            # Only save if we need to convert or rename (overwrite safety)
            # If src == dest, we just ensure it's saved as PNG?
            # Simpler: Save to temp, then move/overwrite.
            
            temp_path = folder_path / f"temp_{new_name}"
            img.save(temp_path, "PNG")
            
            # 5. Cleanup
            # If the original file was NOT the new name, delete it
            if file_path.name != new_name:
                os.remove(file_path)
            
            # Rename temp to final
            os.replace(temp_path, new_path)
            
            print(f"   Converted: {filename} -> {new_name}")
                
        except Exception as e:
            print(f"   ❌ Error processing {filename}: {e}")

if __name__ == "__main__":
    if not BASE_DIR.exists():
        print(f"❌ Base directory {BASE_DIR} does not exist.")
    else:
        for d in BASE_DIR.iterdir():
            if d.is_dir():
                sanitize_folder(d)
