
import os
import shutil
import io
import sys
from pathlib import Path
from PIL import Image
from rembg import remove

# Re-implementing core logic here to avoid import issues from the other script
# which might not be modular.

def create_sleek_background(width, height):
    # Simple radial gradient background
    from PIL import ImageDraw
    img = Image.new('RGBA', (width, height), (0, 0, 0, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw radial gradient
    # Center (lighter) -> Edge (darker)
    # 0x242424 -> 0x050505
    # Just generic dark grey for now or reuse existing logic
    # Approximate "Sleek Studio"
    
    # Fallback to simple solid color if complex gradient is hard
    # BUT user wants Sleek Studio. 
    # Let's try to simulate the gradient.
    
    for y in range(height):
        # Linear approximation for speed
        # Center is (width/2, height/2)
        # distance from center
        # This is slow in python.
        pass
        
    # Better: Use a pre-generated background if available, or just solid dark.
    # The original script had a gradient function. Let's just use solid dark for safety
    # OR we invoke the original script via subprocess which is safer.
    return img

def main():
    print("🎨 Processing Variants for Uniformity (Subprocess Mode)...")
    
    import subprocess
    
    VARIANTS = [
        "tmp/production_staging/porsche_911_manthey",
        "tmp/production_staging/subaru_brz_te37",
        "tmp/production_staging/mercedes_c63_rohana"
    ]
    
    script_path = "scripts/process_sleek_studio.py"
    
    for variant in VARIANTS:
        folder = Path(variant)
        if not folder.exists():
            print(f"Skipping {variant} (Not found)")
            continue
            
        print(f"   Processing {folder.name}...")
        
        # Output to a temp folder
        temp_out = folder.parent / (folder.name + "_processed")
        if temp_out.exists():
            shutil.rmtree(temp_out)
            
        # Call the existing script
        cmd = ["python", script_path, str(folder), str(temp_out)]
        subprocess.run(cmd)
        
        # If successful, replace original
        if temp_out.exists() and any(temp_out.iterdir()):
             shutil.rmtree(folder)
             shutil.move(str(temp_out), str(folder))
             print(f"✅ Completed: {folder.name}")
        else:
             print(f"❌ Failed to process {folder.name}")

if __name__ == "__main__":
    main()
