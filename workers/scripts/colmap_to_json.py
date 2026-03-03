import sys
import json
import os

def parse_cameras(camera_path):
    cameras = {}
    if not os.path.exists(camera_path):
        return cameras
    with open(camera_path, 'r') as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            parts = line.split()
            # ID, MODEL, WIDTH, HEIGHT, PARAMS...
            cam_id = int(parts[0])
            cameras[cam_id] = {
                "model": parts[1],
                "width": int(parts[2]),
                "height": int(parts[3]),
                "params": [float(x) for x in parts[4:]]
            }
    return cameras

def parse_images(image_path, cameras):
    images = []
    if not os.path.exists(image_path):
        return images
    with open(image_path, 'r') as f:
        lines = f.readlines()
        
    # COLMAP images.txt alternates lines: image info, then feature points (skip second)
    for i in range(0, len(lines)):
        line = lines[i].strip()
        if line.startswith("#") or not line:
            continue
        
        parts = line.split()
        if len(parts) < 10:
            continue
            
        # IMAGE_ID, QW, QX, QY, QZ, TX, TY, TZ, CAMERA_ID, NAME
        img_id = int(parts[0])
        qw, qx, qy, qz = map(float, parts[1:5])
        tx, ty, tz = map(float, parts[5:8])
        cam_id = int(parts[8])
        name = parts[9]
        
        # Add to list (skip second line of points)
        images.append({
            "id": img_id,
            "name": name,
            "rotation": [qw, qx, qy, qz],
            "position": [tx, ty, tz],
            "camera_id": cam_id,
            "camera": cameras.get(cam_id, {})
        })
        
        # Skip the next line which contains 2D points
        # But wait, we need to skip *all* lines until the next header line if multi-line points exist.
        # Actually, in standard TXT it's exactly one line of metadata, one line of points.
        # However, it's safer to just skip any line that doesn't look like a header if we were iterating properly.
        # Standard iterator approach:
        
    return images

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 colmap_to_json.py <sparse_dir> <output_json>")
        sys.exit(1)
        
    sparse_dir = sys.argv[1]
    output_path = sys.argv[2]
    
    camera_txt = os.path.join(sparse_dir, "cameras.txt")
    images_txt = os.path.join(sparse_dir, "images.txt")
    
    if not os.path.exists(images_txt):
        print(f"Error: {images_txt} not found")
        sys.exit(1)
        
    cameras = parse_cameras(camera_txt)
    
    # Robust image parsing for alternating lines
    images = []
    with open(images_txt, 'r') as f:
        lines = [l.strip() for l in f if l.strip() and not l.startswith("#")]
        
    # Step through 2 at a time (header, points)
    for i in range(0, len(lines), 2):
        parts = lines[i].split()
        if len(parts) < 10: continue
        
        img_id = int(parts[0])
        qw, qx, qy, qz = map(float, parts[1:5])
        tx, ty, tz = map(float, parts[5:8])
        cam_id = int(parts[8])
        name = parts[9]
        
        images.append({
            "id": img_id,
            "name": name,
            "rotation": [qw, qx, qy, qz],
            "position": [tx, ty, tz],
            "camera_id": cam_id,
            "camera": cameras.get(cam_id, {})
        })

    data = {
        "contract": "COLMAP_SFM",
        "status": "computed",
        "frameCount": len(images),
        "frames": images
    }
    
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Successfully wrote {len(images)} poses to {output_path}")

if __name__ == "__main__":
    main()
