"""
Blender script to aggressively optimize car models for mobile (<3MB target)
Usage: blender --background --python optimize_for_mobile.py -- input.glb output.glb
"""

import bpy
import sys
import os
import json

def optimize_model(input_path, output_path):
    """Optimize 3D car model for mobile performance - aggressive mode"""
    
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Import GLB/GLTF
    print(f"Importing {input_path}...")
    bpy.ops.import_scene.gltf(filepath=input_path)
    
    # Get stats BEFORE optimization
    total_tris_before = sum(len(obj.data.polygons) for obj in bpy.context.scene.objects if obj.type == 'MESH')
    
    print(f"BEFORE: {total_tris_before} triangles")
    
    # Decimate each mesh aggressively (target 50k total triangles)
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    target_tris = 50000
    
    for obj in mesh_objects:
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        
        current_tris = len(obj.data.polygons)
        if current_tris > 1000:
            # Calculate ratio to achieve target
            decimate_ratio = min(0.9, (target_tris / len(mesh_objects)) / current_tris)
            decimate_ratio = max(0.1, decimate_ratio)  # Don't go below 10%
            
            modifier = obj.modifiers.new(name="Decimate", type='DECIMATE')
            modifier.ratio = decimate_ratio
            bpy.ops.object.modifier_apply(modifier="Decimate")
            print(f"Decimated {obj.name}: {current_tris} -> {len(obj.data.polygons)} tris (ratio: {decimate_ratio:.2f})")
    
    # Resize textures aggressively (max 1024x1024)
    for img in bpy.data.images:
        if img.size[0] > 1024 or img.size[1] > 1024:
            print(f"Resizing texture {img.name}: {img.size[0]}x{img.size[1]} -> 1024x1024")
            img.scale(1024, 1024)
    
    # Get stats AFTER optimization
    total_tris_after = sum(len(obj.data.polygons) for obj in bpy.context.scene.objects if obj.type == 'MESH')
    
    print(f"AFTER: {total_tris_after} triangles")
    
    # Export GLB with maximum Draco compression
    print(f"Exporting to {output_path} with Draco compression...")
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=10,  # Maximum compression
        export_draco_position_quantization=14,
        export_draco_normal_quantization=10,
        export_draco_texcoord_quantization=12,
        export_image_format='JPEG',  # Use JPEG for smaller size
        export_texture_dir='',
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT'
    )
    
    # Write stats to JSON
    stats_path = output_path.replace('.glb', '_stats.json')
    with open(stats_path, 'w') as f:
        json.dump({
            'before': {'triangles': total_tris_before},
            'after': {'triangles': total_tris_after},
            'reduction_percent': round((1 - total_tris_after / total_tris_before) * 100, 1)
        }, f, indent=2)
    
    print(f"✅ Optimization complete!")
    print(f"Triangle reduction: {total_tris_before} -> {total_tris_after} ({round((1 - total_tris_after / total_tris_before) * 100, 1)}%)")


if __name__ == "__main__":
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    if len(argv) < 2:
        print("Usage: blender --background --python optimize_for_mobile.py -- input.glb output.glb")
        sys.exit(1)
    
    input_path = argv[0]
    output_path = argv[1]
    
    optimize_model(input_path, output_path)
