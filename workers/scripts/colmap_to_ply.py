import sys
import os

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 colmap_to_ply.py <points3D_txt> <output_ply>")
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        sys.exit(1)
        
    points = []
    with open(input_path, 'r') as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            parts = line.split()
            # POINT3D_ID, X, Y, Z, R, G, B, ERROR, TRACK_LIST
            x, y, z = parts[1], parts[2], parts[3]
            r, g, b = parts[4], parts[5], parts[6]
            points.append(f"{x} {y} {z} {r} {g} {b}")
            
    with open(output_path, 'w') as f:
        f.write("ply\n")
        f.write("format ascii 1.0\n")
        f.write(f"element vertex {len(points)}\n")
        f.write("property float x\n")
        f.write("property float y\n")
        f.write("property float z\n")
        f.write("property uchar red\n")
        f.write("property uchar green\n")
        f.write("property uchar blue\n")
        f.write("end_header\n")
        for p in points:
            f.write(p + "\n")
            
    print(f"Successfully wrote {len(points)} points to {output_path}")

if __name__ == "__main__":
    main()
