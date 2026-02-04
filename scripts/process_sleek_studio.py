import os
import sys
import numpy as np
from PIL import Image, ImageOps
from rembg import remove
from pathlib import Path
import io

# Usage: python scripts/process_sleek_studio.py <INPUT_DIR> <OUTPUT_DIR>

def create_sleek_background(width, height):
    # Create a radial gradient (dark center to black edges)
    # Center: #333333, Edge: #050505
    x = np.linspace(-1, 1, width)
    y = np.linspace(-1, 1, height)
    xv, yv = np.meshgrid(x, y)
    
    # Radial distance from center
    dist = np.sqrt(xv**2 + yv**2)
    dist = np.clip(dist, 0, 1)
    
    # Invert for brightness at center
    mask = 1 - dist
    
    # Colors
    center_color = np.array([40, 40, 45]) # Dark Gray
    edge_color = np.array([5, 5, 5])      # Almost Black
    
    # Interpolate
    r = (center_color[0] * mask + edge_color[0] * (1 - mask)).astype(np.uint8)
    g = (center_color[1] * mask + edge_color[1] * (1 - mask)).astype(np.uint8)
    b = (center_color[2] * mask + edge_color[2] * (1 - mask)).astype(np.uint8)
    
    bg = np.dstack((r, g, b))
    return Image.fromarray(bg)

def process_folder(input_dir, output_dir):
    input_path = Path(input_dir)
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    print(f"🎨 Processing Sleek Studio for: {input_path}")
    
    files = sorted([f for f in os.listdir(input_path) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))])
    
    if not files:
        print("❌ No images found.")
        return

    # Generate Background Template (1024x1024 standard)
    bg_template = create_sleek_background(1024, 1024)
    
    for f in files:
        print(f"   🖌️  Processing {f}...")
        try:
            # 1. Load & Remove Background
            try:
                with open(input_path / f, 'rb') as i:
                    input_data = i.read()
                
                # Check mode and convert if necessary using PIL before rembg
                img_check = Image.open(io.BytesIO(input_data))
                img_check = img_check.convert("RGBA")
                
                # Convert back to bytes for rembg
                buf = io.BytesIO()
                img_check.save(buf, format="PNG")
                input_data = buf.getvalue()

                # Use 'rembg' to get transparent car
                try:
                    car_transparent_data = remove(input_data, alpha_matting=True)
                except Exception as matting_err:
                    print(f"      ⚠️  Alpha matting failed, retrying without: {matting_err}")
                    car_transparent_data = remove(input_data, alpha_matting=False)

            except Exception as load_err:
                 print(f"      ⚠️  Pre-processing fix/Fallback for {f}: {load_err}")
                 # Fallback: simple read
                 with open(input_path / f, 'rb') as i:
                    input_data = i.read()
                 try:
                    car_transparent_data = remove(input_data, alpha_matting=True)
                 except:
                    car_transparent_data = remove(input_data, alpha_matting=False)

            car_img = Image.open(io.BytesIO(car_transparent_data)).convert("RGBA")
            
            # 2. Resize/Fit car to Template
            # Target width: ~85% of canvas
            target_w = int(1024 * 0.90)
            aspect = car_img.height / car_img.width
            target_h = int(target_w * aspect)
            
            car_img = car_img.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            # 3. Composite
            # Center the car
            pos_x = (1024 - target_w) // 2
            pos_y = (1024 - target_h) // 2 + 50 # Slightly lower to feel grounded
            
            final_comp = bg_template.copy()
            final_comp.alpha_composite(car_img, (pos_x, pos_y))
            
            # 4. Save
            final_name = Path(f).stem + ".png" # Force PNG
            final_comp.save(output_path / final_name)
            print(f"      ✅ Saved {final_name}")
            
        except Exception as e:
            print(f"      ❌ Failed: {e}")

if __name__ == "__main__":
    import io
    if len(sys.argv) < 3:
        print("Usage: python scripts/process_sleek_studio.py <INPUT_DIR> <OUTPUT_DIR>")
    else:
        process_folder(sys.argv[1], sys.argv[2])
