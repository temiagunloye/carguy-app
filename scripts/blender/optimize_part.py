"""
Blender script to optimize part models for mobile
Usage: blender --background --python optimize_part.py -- input.glb output.glb [target_triangles]
"""

import bpy
import sys
import os
import json

def optimize_part(input_path, output_path, target_triangles=15000):
    """Optimize 3D part model for mobile performance"""
    
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
    
    print(f"BEFORE: {stats_before['triangles']} triangles, {stats_before['objects']} meshes")
    
    # Calculate bounding box
    all_objs = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if all_objs:
        min_x = min(obj.bound_box[0][0] + obj.location.x for obj in all_objs)
        max_x = max(obj.bound_box[6][0] + obj.location.x for obj in all_objs)
        min_y = min(obj.bound_box[0][1] + obj.location.y for obj in all_objs)
        max_y = max(obj.bound_box[6][1] + obj.location.y for obj in all_objs)
        min_z = min(obj.bound_box[0][2] + obj.location.z for obj in all_objs)
        max_z = max(obj.bound_box[6][2] + obj.location.z for obj in all_objs)
        
        dimensions = {
            'x': (max_x - min_x) * 1000, # Convert to mm
            'y': (max_y - min_y) * 1000,
            'z': (max_z - min_z) * 1000
        }
    else:
        dimensions = {'x': 0, 'y': 0, 'z': 0}

    # Decimate
    for obj in bpy.context.scene.objects:
        if obj.type == 'MESH':
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            
            current_tris = len(obj.data.polygons)
            # Only decimate if significantly over target (split budget roughly by object count or just per object cap)
            # Simple strategy: If single object > target, reduce it.
            if current_tris > 5000: 
                decimate_ratio = min(1.0, target_triangles / (total_tris_before * 1.2)) # Conservative
                if decimate_ratio < 1.0:
                    modifier = obj.modifiers.new(name="Decimate", type='DECIMATE')
                    modifier.ratio = decimate_ratio
                    bpy.ops.object.modifier_apply(modifier="Decimate")
                    print(f"Decimated {obj.name}: {current_tris} -> {len(obj.data.polygons)} tris")
    
    # Optimize textures (smaller than cars, parts usually fine with 1024 or 512)
    for img in bpy.data.images:
        if img.size[0] > 1024 or img.size[1] > 1024:
            print(f"Resizing texture {img.name}: {img.size[0]}x{img.size[1]} -> 1024x1024")
            img.scale(1024, 1024)
    
    # Get stats AFTER optimization
    total_tris_after = sum(len(obj.data.polygons) for obj in bpy.context.scene.objects if obj.type == 'MESH')
    
    stats_after = {
        'triangles': total_tris_after,
        'objects': len([obj for obj in bpy.context.scene.objects if obj.type == 'MESH'])
    }
    
    print(f"AFTER: {stats_after['triangles']} triangles")
    
    # Export GLB
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
    
    # Write metadata sidecar
    stats_path = output_path.replace('.glb', '_meta.json')
    with open(stats_path, 'w') as f:
        json.dump({
            'stats': {
                'before': stats_before,
                'after': stats_after,
                'reduction': round((1 - stats_after['triangles'] / max(1, stats_before['triangles'])) * 100, 1)
            },
            'dimensionsMm': dimensions,
            'defaultScale': 1.0
        }, f, indent=2)
    
    print(f"✅ Part optimization complete! Meta saved to {stats_path}")

if __name__ == "__main__":
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    if len(argv) < 2:
        print("Usage: blender --background --python optimize_part.py -- input.glb output.glb [target_triangles]")
        sys.exit(1)
    
    input_path = argv[0]
    output_path = argv[1]
    target_triangles = int(argv[2]) if len(argv) > 2 else 15000
    
    optimize_part(input_path, output_path, target_triangles)
