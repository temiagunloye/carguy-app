"""
Blender script to optimize car models for mobile
Usage: blender --background --python optimize_car_model.py -- input.glb output.glb target_triangles
"""

import bpy
import sys
import os
import json

def optimize_model(input_path, output_path, target_triangles=100000):
    """Optimize 3D car model for mobile performance"""
    
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Import GLB/GLTF
    print(f"Importing {input_path}...")
    if input_path.endswith('.glb') or input_path.endswith('.gltf'):
        bpy.ops.import_scene.gltf(filepath=input_path)
    else:
        print(f"Error: Unsupported format. Use .glb or .gltf")
        sys.exit(1)
    
    # Get stats BEFORE optimization
    total_tris_before = sum(len(obj.data.polygons) for obj in bpy.context.scene.objects if obj.type == 'MESH')
    
    stats_before = {
        'triangles': total_tris_before,
        'objects': len([obj for obj in bpy.context.scene.objects if obj.type == 'MESH']),
        'materials': len(bpy.data.materials)
    }
    
    print(f"BEFORE: {stats_before['triangles']} triangles, {stats_before['objects']} meshes, {stats_before['materials']} materials")
    
    # Join all meshes (optional, can comment out if you want separate parts)
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if len(mesh_objects) > 1:
        bpy.ops.object.select_all(action='DESELECT')
        for obj in mesh_objects:
            obj.select_set(True)
        bpy.context.view_layer.objects.active = mesh_objects[0]
        # Note: Commenting out join to preserve separate parts for anchors later
        # bpy.ops.object.join()
    
    # Decimate each mesh
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            
            # Add decimate modifier
            current_tris = len(obj.data.polygons)
            if current_tris > 10000:  # Only decimate if >10k tris
                decimate_ratio = min(1.0, target_triangles / (total_tris_before * 1.5))
                modifier = obj.modifiers.new(name="Decimate", type='DECIMATE')
                modifier.ratio = decimate_ratio
                bpy.ops.object.modifier_apply(modifier="Decimate")
                print(f"Decimated {obj.name}: {current_tris} -> {len(obj.data.polygons)} tris")
    
    # Optimize textures
    for img in bpy.data.images:
        if img.size[0] > 2048 or img.size[1] > 2048:
            print(f"Resizing texture {img.name}: {img.size[0]}x{img.size[1]} -> 2048x2048")
            img.scale(2048, 2048)
    
    # Get stats AFTER optimization
    total_tris_after = sum(len(obj.data.polygons) for obj in bpy.context.scene.objects if obj.type == 'MESH')
    
    stats_after = {
        'triangles': total_tris_after,
        'objects': len([obj for obj in bpy.context.scene.objects if obj.type == 'MESH']),
        'materials': len(bpy.data.materials)
    }
    
    print(f"AFTER: {stats_after['triangles']} triangles, {stats_after['objects']} meshes, {stats_after['materials']} materials")
    
    # Export GLB with Draco compression
    print(f"Exporting to {output_path}...")
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='AUTO',
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_colors=True
    )
    
    # Write stats to JSON
    stats_path = output_path.replace('.glb', '_stats.json')
    with open(stats_path, 'w') as f:
        json.dump({
            'before': stats_before,
            'after': stats_after,
            'reduction_percent': round((1 - stats_after['triangles'] / stats_before['triangles']) * 100, 1)
        }, f, indent=2)
    
    print(f"✅ Optimization complete! Stats saved to {stats_path}")
    print(f"Triangle reduction: {stats_before['triangles']} -> {stats_after['triangles']} ({round((1 - stats_after['triangles'] / stats_before['triangles']) * 100, 1)}%)")


if __name__ == "__main__":
    # Parse arguments (after --)
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    if len(argv) < 2:
        print("Usage: blender --background --python optimize_car_model.py -- input.glb output.glb [target_triangles]")
        sys.exit(1)
    
    input_path = argv[0]
    output_path = argv[1]
    target_triangles = int(argv[2]) if len(argv) > 2 else 100000
    
    optimize_model(input_path, output_path, target_triangles)
