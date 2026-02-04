import os
import sys
from PIL import Image

def slice_grid(image_path, car_name, output_dir):
    print(f"Processing {car_name} from {image_path}...")
    img = Image.open(image_path)
    width, height = img.size
    
    # Assuming a layout. Usually these grids are 2x5 or 3x4 or similar.
    # However, 'generate_image' might return a single composited image or just the first angle if not specified as a grid.
    # Looking at the output, it returned a single file. 
    # If the user prompt asked for a "set", the model often produces a grid.
    # Let's assume it's a grid and try to detect rows/cols.
    # For a 10-angle set, a 5x2 or 2x5 grid is common.
    
    # Heuristic: Slices into 10 evenly.
    # Let's try 5 columns, 2 rows.
    
    # Updated Layout for "Wide Shot" generations: 3 columns x 4 rows
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
            
            crop = img.crop((left, top, right, bottom))
            filename = f"angle_{count:02d}.png"
            crop.save(os.path.join(output_dir, filename))
            print(f"  Saved {filename}")
            count += 1

if __name__ == "__main__":
    # Args: input_image_path car_folder_name
    if len(sys.argv) < 3:
        print("Usage: python split.py <path_to_grid> <output_folder_name>")
        sys.exit(1)
        
    img_path = sys.argv[1]
    folder_name = sys.argv[2]
    out_path = os.path.join("tmp/production_staging", folder_name)
    
    slice_grid(img_path, folder_name, out_path)
