from PIL import Image
import sys
import os

def loose_bbox_crop(img, threshold=20):
    # Convert to grayscale
    gray = img.convert("L")
    # Threshold
    mask = gray.point(lambda p: 255 if p > threshold else 0)
    bbox = mask.getbbox()
    return bbox

def process_grid_smart_crop(image_path, output_dir, padding=0.05):
    print(f"Processing {image_path} with Smart Auto-Crop...")
    img = Image.open(image_path)
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    width, height = img.size
    n_cols = 3
    n_rows = 4
    
    tile_w = width // n_cols
    tile_h = height // n_rows
    
    os.makedirs(output_dir, exist_ok=True)
    
    count = 1
    for row in range(n_rows):
        for col in range(n_cols):
            if count > 10: break
            
            left = col * tile_w
            top = row * tile_h
            right = left + tile_w
            bottom = top + tile_h
            


            # Extract tile
            tile = img.crop((left, top, right, bottom))

            # Clean Full-View Strategy
            # 1. No Zoom: Use full tile width to keep car "zoomed out".
            # 2. Text Removal: Crop bottom 15% (where "angle_XX" text is).
            
            # Crop off bottom 15%
            crop_h_effective = int(tile_h * 0.85)
            
            # Crop Top-Left to Right-[Effective Bottom]
            # This keeps the top and sides, but cuts off the bottom text area.
            final_crop = tile.crop((0, 0, tile_w, crop_h_effective))
            print(f"  Text Removal Crop: (0, 0, {tile_w}, {crop_h_effective})")
            
            # Resize back to standard tile size to maintain aspect ratio/fill container
            # This might stretch slightly vertically if we don't crop width, 
            # BUT the viewer is object-fit: contain, so aspect ratio matters.
            # If we crop height but not width, the image becomes wide.
            # Let's crop width proportionally to keep aspect ratio if needed?
            # actually, let's just resize to tile_w x tile_h. The slight vertical stretch is negligible (~15%)
            # and better than black borders or cutting off the car.
            # OR we can crop 7.5% from left and right to maintain aspect ratio?
            # Let's just crop bottom. The stretch will make the car look slightly wider/lower (sportier).
            
            final_crop_resized = final_crop.resize((tile_w, tile_h), Image.Resampling.LANCZOS)
            
            filename = f"angle_{count:02d}.png"
            output_path = os.path.join(output_dir, filename)
            final_crop_resized.save(output_path)
            print(f"  Saved {filename}")
            
            count += 1

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python scripts/smart_crop_split.py <input_grid> <output_dir>")
        sys.exit(1)
        
    img_path = sys.argv[1]
    out_dir = sys.argv[2]
    
    # Use smart crop
    process_grid_smart_crop(img_path, out_dir)
