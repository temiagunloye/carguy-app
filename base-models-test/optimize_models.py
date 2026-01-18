#!/usr/bin/env python3
"""
GLB Model Optimizer for Mobile/Web
Reduces file size while maintaining visual quality
"""

import bpy
import sys
import os
from pathlib import Path

def optimize_model(input_path, output_path, target_triangles=150000, texture_size=1024):
    """
    Optimize a GLB model for mobile/web use
    
    Args:
        input_path: Path to input GLB file
        output_path: Path to save optimized GLB
        target_triangles: Target triangle count (default 150K)
        texture_size: Max texture dimension (default 1024)
    """
    print(f"\n{'='*60}")
    print(f"Optimizing: {input_path}")
    print(f"{'='*60}")
    
    # Clear existing scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Import GLB
    print("📥 Importing model...")
    bpy.ops.import_scene.gltf(filepath=input_path)
    
    # Get all mesh objects
    mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    
    if not mesh_objects:
        print("⚠️  No mesh objects found!")
        return False
    
    # Calculate current triangle count
    total_tris = sum(len(obj.data.polygons) for obj in mesh_objects)
    print(f"📊 Current triangles: {total_tris:,}")
    
    # Apply Decimate modifier if needed
    if total_tris > target_triangles:
        decimate_ratio = target_triangles / total_tris
        print(f"🔧 Reducing by {(1-decimate_ratio)*100:.1f}%...")
        
        for obj in mesh_objects:
            # Select object
            bpy.context.view_layer.objects.active = obj
            obj.select_set(True)
            
            # Add decimate modifier
            mod = obj.modifiers.new(name="Decimate", type='DECIMATE')
            mod.ratio = decimate_ratio
            mod.use_collapse_triangulate = True
            
            # Apply modifier
            bpy.ops.object.modifier_apply(modifier="Decimate")
            obj.select_set(False)
        
        new_tris = sum(len(obj.data.polygons) for obj in mesh_objects)
        print(f"✅ New triangles: {new_tris:,} ({(new_tris/total_tris)*100:.1f}% of original)")
    else:
        print(f"✅ Triangle count already optimal ({total_tris:,})")
    
    # Compress textures
    print(f"🖼️  Compressing textures to {texture_size}x{texture_size}...")
    for img in bpy.data.images:
        if img.size[0] > texture_size or img.size[1] > texture_size:
            img.scale(texture_size, texture_size)
            print(f"   Resized: {img.name}")
    
    # Export optimized GLB
    print(f"💾 Exporting to: {output_path}")
    bpy.ops.export_scene.gltf(
        filepath=output_path,
        export_format='GLB',
        use_selection=False,
        export_apply=True,
        export_texcoords=True,
        export_normals=True,
        export_materials='EXPORT',
        export_cameras=False,
        export_lights=False,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_texture_dir='',
    )
    
    # Check file sizes
    input_size = os.path.getsize(input_path) / (1024 * 1024)  # MB
    output_size = os.path.getsize(output_path) / (1024 * 1024)  # MB
    reduction = ((input_size - output_size) / input_size) * 100
    
    print(f"\n📦 Results:")
    print(f"   Original: {input_size:.2f} MB")
    print(f"   Optimized: {output_size:.2f} MB")
    print(f"   Reduction: {reduction:.1f}%")
    
    if output_size < 10:
        print(f"   ✅ Target met! (<10 MB)")
    else:
        print(f"   ⚠️  Still large, but improved")
    
    return True


def main():
    """Main optimization function"""
    # Get script directory
    script_dir = Path(__file__).parent
    
    # Models to optimize
    models = [
        "toyota_camry.glb",
        "mercedes_eclass.glb"
    ]
    
    print("\n🚀 GLB Model Optimizer")
    print("="*60)
    
    for model_name in models:
        input_path = str(script_dir / model_name)
        output_name = model_name.replace('.glb', '_optimized.glb')
        output_path = str(script_dir / output_name)
        
        if not os.path.exists(input_path):
            print(f"⚠️  Skipping {model_name} (file not found)")
            continue
        
        try:
            optimize_model(
                input_path=input_path,
                output_path=output_path,
                target_triangles=120000,  # 120K triangles
                texture_size=1024  # 1024x1024 textures
            )
            print(f"✅ Success: {output_name}")
        except Exception as e:
            print(f"❌ Error optimizing {model_name}: {e}")
    
    print("\n" + "="*60)
    print("🎉 Optimization complete!")
    print("="*60)
    print("\nNext steps:")
    print("1. Rename optimized files:")
    print("   mv toyota_camry_optimized.glb toyota_camry.glb")
    print("   mv mercedes_eclass_optimized.glb mercedes_eclass.glb")
    print("2. Refresh test-viewer.html in browser")
    print("3. Verify models load successfully")


if __name__ == "__main__":
    # Run in Blender's Python environment
    main()
