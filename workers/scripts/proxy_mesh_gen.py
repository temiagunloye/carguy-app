import trimesh
import sys
import os
import numpy as np

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 proxy_mesh_gen.py <input_ply> <output_glb>")
        sys.exit(1)
        
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        sys.exit(1)
        
    print(f"Loading point cloud from {input_path}...")
    pcd = trimesh.load(input_path)
    
    if not isinstance(pcd, trimesh.PointCloud):
        print("Loaded object is already a mesh or scene. Converting to vertices...")
        if hasattr(pcd, 'vertices'):
            vertices = pcd.vertices
        else:
            # Handle scenes
            vertices = pcd.dump(concatenate=True).vertices
    else:
        vertices = pcd.vertices

    point_count = len(vertices)
    print(f"Initial point count: {point_count}")
    
    if point_count < 3:
        print("Error: Too few points to generate proxy.")
        sys.exit(1)

    # 1. Outlier Removal (Drop top 2% farthest points from centroid)
    centroid = vertices.mean(axis=0)
    dists = np.linalg.norm(vertices - centroid, axis=1)
    threshold = np.percentile(dists, 98)
    filtered_vertices = vertices[dists <= threshold]
    print(f"Filtered points (98th percentile): {len(filtered_vertices)}")

    # 2. Normalization (Center at origin, Scale max axis to 4.0)
    # Use min/max for centering
    vmin = filtered_vertices.min(axis=0)
    vmax = filtered_vertices.max(axis=0)
    center = (vmin + vmax) / 2.0
    
    print(f"Bounds Pre-Normalize: min={vmin}, max={vmax}")
    
    # Shift to center
    norm_vertices = filtered_vertices - center
    
    vsize = vmax - vmin
    max_dim = vsize.max()
    scale = 1.0
    if max_dim > 0:
        scale = 4.0 / max_dim
        norm_vertices *= scale
        print(f"Normalized with scale factor: {scale:.4f} (MaxDim: {max_dim:.4f})")

    # 3. Robust Mesh Generation
    mesh = None
    try:
        print("Attempting Convex Hull...")
        # Create a temp pointcloud for the hull operation
        temp_pcd = trimesh.PointCloud(norm_vertices)
        mesh = temp_pcd.convex_hull
        print(f"Convex Hull successful: {len(mesh.vertices)} verts, {len(mesh.faces)} faces")
    except Exception as e:
        print(f"Convex Hull failed: {e}. Falling back to AABB mesh.")
        # Fallback: Create a box mesh from the normalized bounds
        nvmin = norm_vertices.min(axis=0)
        nvmax = norm_vertices.max(axis=0)
        box_center = (nvmin + nvmax) / 2.0
        box_size = nvmax - nvmin
        mesh = trimesh.creation.box(extents=box_size, transform=trimesh.transformations.translation_matrix(box_center))
        print("Fallback AABB box generated.")

    # Final Bounds check
    final_min = mesh.vertices.min(axis=0)
    final_max = mesh.vertices.max(axis=0)
    print(f"Bounds Post-Normalize: min={final_min}, max={final_max}")

    print(f"Exporting proxy mesh to {output_path}...")
    mesh.export(output_path)
    file_size = os.path.getsize(output_path)
    print(f"Done. Final size: {file_size} bytes")

if __name__ == "__main__":
    main()
