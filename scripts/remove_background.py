import os
import sys
import argparse
from rembg import remove
from PIL import Image
from pathlib import Path

# Usage: python scripts/remove_background.py <CAR_ID>
# Needs: pip install rembg pillow

def clean_car(car_id):
    print(f"🎨 Design Agent (Vector) starting for {car_id}...")
    
    input_dir = Path(f"output/scraped/{car_id}")
    output_dir = Path(f"output/renders/{car_id}")
    
    if not input_dir.exists():
        print(f"❌ Error: Source directory {input_dir} does not exist. Run acquisition first.")
        return

    output_dir.mkdir(parents=True, exist_ok=True)
    
    files = sorted([f for f in os.listdir(input_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))])
    
    if not files:
        print("❌ No images found to process.")
        return

    print(f"Found {len(files)} raw images. Selecting 10 equidistant angles...")

    # We need exactly 10 angles: 
    # Front, Front/Left, Left, Rear/Left, Rear, Rear/Right, Right, Front/Right
    # + Front/Low, Rear/Low (Optional, usually duplicates of Front/Rear if spin is flat)
    
    # Simple mapping logic: Divide the sequence into 8 main chunks
    # Assumes the spin is a full 360 loop.
    
    step = len(files) / 8
    indices = [int(i * step) for i in range(8)]
    
    # Map to our standard keys
    keys = [
        'front',            # 0
        'front_left',       # 1
        'left',             # 2
        'rear_left',        # 3
        'rear',             # 4
        'rear_right',       # 5
        'right',            # 6
        'front_right'       # 7
    ]
    
    # Extra keys (Low angles - reuse front/rear or find others)
    # For now, reuse Main Front/Rear
    extra_map = {
        'front_center': indices[0],
        'front_low': indices[0],
        'rear_center': indices[4],
        'rear_low': indices[4],
        'driver_front': indices[1], # Approx
        'passenger_front': indices[7],
        'full_driver_side': indices[2],
        'full_passenger_side': indices[6],
        'driver_rear': indices[3],
        'passenger_rear': indices[5]
    }
    
    processed_count = 0
    
    # Process the mapped keys
    # Consolidate standard keys + extra mappings
    
    final_mapping = {}
    
    # Helper to process
    def process_image(idx, key_name):
        src_file = files[idx]
        src_path = input_dir / src_file
        dest_path = output_dir / f"{key_name}.png"
        
        print(f"   🖌️ Processing {key_name} (Source: {src_file})...")
        
        with open(src_path, 'rb') as i:
            with open(dest_path, 'wb') as o:
                input_data = i.read()
                # High Accuracy Parameters
                output_data = remove(
                    input_data, 
                    alpha_matting=True,
                    alpha_matting_foreground_threshold=240,
                    alpha_matting_background_threshold=10,
                    alpha_matting_erode_size=10
                )
                o.write(output_data)

    # 1. Standard 8 point walk
    for i, key in enumerate(keys):
        idx = indices[i]
        process_image(idx, key)
        processed_count += 1
        
    # 2. Extras (Aliases)
    # We can just copy the file or process again. Processing again is safer to ensure unique file handles.
    for key, idx in extra_map.items():
        if key not in keys: # Avoid double work if already done
             process_image(idx, key)
             processed_count += 1

    print(f"✅ Design Agent finished. {processed_count} vector images created in {output_dir}")
    print(f"👉 Next Step: Run 'npm run ingest:upload-render' (User must edit script to point to {car_id} first)")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/remove_background.py <CAR_ID>")
    else:
        clean_car(sys.argv[1])
