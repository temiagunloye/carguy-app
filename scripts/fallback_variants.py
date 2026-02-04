
import os
import shutil
from pathlib import Path
from PIL import Image, ImageOps

VARIANTS = [
    "tmp/production_staging/porsche_911_manthey",
    "tmp/production_staging/subaru_brz_te37",
    "tmp/production_staging/mercedes_c63_rohana"
]

def create_black_background(width, height):
    return Image.new('RGBA', (width, height), (5, 5, 5, 255))

def process_fallback():
    print("🛡️ Running Fallback Processing for Variants...")
    
    for variant in VARIANTS:
        folder = Path(variant)
        if not folder.exists():
            continue
            
        print(f"   Processing {folder.name}...")
        files = sorted([f for f in os.listdir(folder) if f.lower().endswith(('.png', '.jpg', '.jpeg'))])
        
        bg_template = create_black_background(1024, 1024)
        
        for f in files:
            try:
                # Open
                img_path = folder / f
                img = Image.open(img_path).convert("RGBA")
                
                # Resize to fit 1024x1024 (keep aspect)
                target_w = int(1024 * 0.90)
                aspect = img.height / img.width
                target_h = int(target_w * aspect)
                img = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
                
                # Center
                pos_x = (1024 - target_w) // 2
                pos_y = (1024 - target_h) // 2
                
                # Composite
                final_comp = bg_template.copy()
                final_comp.alpha_composite(img, (pos_x, pos_y))
                
                # Overwrite original
                # We rename to .png
                final_name = Path(f).stem + ".png"
                final_comp.save(folder / final_name)
                
                if final_name != f:
                    os.remove(img_path)
                    
                print(f"      ✅ Fixed {final_name}")
                
            except Exception as e:
                print(f"      ❌ Failed {f}: {e}")

if __name__ == "__main__":
    process_fallback()
