import os
import sys
from PIL import Image

def slice_mixed_grid(image_path, car_name, output_dir):
    print(f"Processing Mixed Grid (3-3-2-2) for {car_name}...")
    img = Image.open(image_path)
    width, height = img.size
    
    # 3-3-2-2 Layout Logic
    # 4 Rows total
    row_height = height // 4
    
    # Coordinates mapping
    # (row_index, col_index, total_cols_in_row)
    layout = [
        (0, 0, 3), (0, 1, 3), (0, 2, 3),  # Angles 1-3
        (1, 0, 3), (1, 1, 3), (1, 2, 3),  # Angles 4-6
        (2, 0, 2), (2, 1, 2),             # Angles 7-8
        (3, 0, 2), (3, 1, 2)              # Angles 9-10
    ]
    
    os.makedirs(output_dir, exist_ok=True)
    
    for i, (row, col, ncols) in enumerate(layout):
        angle_num = i + 1
        
        col_width = width // ncols
        
        left = col * col_width
        top = row * row_height
        right = left + col_width
        bottom = top + row_height
        
        # refinement: heavy crop to center the car if needed?
        # For now, just slice exactly to avoid splitting neighboring cells.
        
        crop = img.crop((left, top, right, bottom))
        filename = f"angle_{angle_num:02d}.png"
        crop.save(os.path.join(output_dir, filename))
        print(f"  Saved {filename} (Row {row}, Col {col})")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python slice_mixed_grid.py <path_to_grid> <output_folder_name>")
        sys.exit(1)
        
    img_path = sys.argv[1]
    folder_name = sys.argv[2]
    out_path = os.path.join("tmp/production_staging", folder_name)
    
    slice_mixed_grid(img_path, folder_name, out_path)
