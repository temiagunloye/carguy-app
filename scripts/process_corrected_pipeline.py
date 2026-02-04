from PIL import Image
import os
import shutil

# Configuration
MAPPINGS = [
    {
        "source": "tmp/production_staging/porsche_911_2024_white_corrected",
        "dest_folder": "porsche_911" 
    },
    {
        "source": "tmp/production_staging/porsche_911_manthey_yellow_corrected",
        "dest_folder": "porsche_911_manthey"
    }
]

FINAL_STAGING_ROOT = "tmp/final_staging"

def process_images():
    print("🚀 Starting Corrected Porsche Processing Pipeline...")
    
    for item in MAPPINGS:
        src_dir = item["source"]
        dest_dir = os.path.join(FINAL_STAGING_ROOT, item["dest_folder"])
        
        if not os.path.exists(src_dir):
            print(f"❌ Source directory not found: {src_dir}")
            continue
            
        print(f"📦 Processing {src_dir} -> {dest_dir}...")
        
        # Ensure destination exists
        os.makedirs(dest_dir, exist_ok=True)
        
        files = [f for f in os.listdir(src_dir) if f.endswith('.png')]
        
        for filename in files:
            src_path = os.path.join(src_dir, filename)
            dest_path = os.path.join(dest_dir, filename)
            
            try:
                img = Image.open(src_path)
                w, h = img.size
                
                # CROP STRATEGY: Clean Full-View (Bottom 15% crop)
                # Removes "angle_xx" text
                crop_h_effective = int(h * 0.85)
                final_crop = img.crop((0, 0, w, crop_h_effective))
                
                # Resize back to original w/h to match container
                final_resized = final_crop.resize((w, h), Image.Resampling.LANCZOS)
                
                final_resized.save(dest_path)
                print(f"   ✅ Processed {filename}")
                
            except Exception as e:
                print(f"   ❌ Failed to process {filename}: {e}")

    print("🎉 Processing Complete.")

if __name__ == "__main__":
    process_images()
