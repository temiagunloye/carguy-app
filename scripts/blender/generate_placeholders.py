"""
Blender script to generate placeholder parts for the demo
Usage: blender --background --python generate_placeholders.py -- output_dir
"""

import bpy
import bmesh
import sys
import os
import math

def create_wheel(output_dir):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Simple 5-spoke wheel design
    # Rim
    bpy.ops.mesh.primitive_cylinder_add(radius=0.25, depth=0.25, location=(0, 0, 0), rotation=(0, math.pi/2, 0))
    rim = bpy.context.active_object
    rim.name = "Rim"
    
    # Spokes (simple cubes)
    for i in range(5):
        angle = (2 * math.pi * i) / 5
        bpy.ops.mesh.primitive_cube_add(size=0.05, location=(0, 0, 0))
        spoke = bpy.context.active_object
        spoke.scale = (1, 4, 1)
        spoke.rotation_euler = (angle, 0, 0) # Rotate around X since wheel faces X
        # Fix rotation - local rotation around X axis of the wheel?
        # Wheel axis is X. Spokes should radiate in YZ plane.
        spoke.rotation_euler = (angle, 0, 0)
        
        # Position spoke
        y = 0.12 * math.cos(angle)
        z = 0.12 * math.sin(angle)
        spoke.location = (0, y, z)
        spoke.scale = (0.5, 0.22, 0.1)

    # Join
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    
    # Export
    out_path = os.path.join(output_dir, "wheel_aftermarket_01.glb")
    bpy.ops.export_scene.gltf(filepath=out_path)
    print(f"Created {out_path}")

def create_front_lip(output_dir):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Curved plane for splitter
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.scale = (0.2, 0.9, 0.05) # X=depth, Y=width, Z=height
    
    # Export
    out_path = os.path.join(output_dir, "front_lip_01.glb")
    bpy.ops.export_scene.gltf(filepath=out_path)
    print(f"Created {out_path}")

def create_side_skirt(output_dir):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Long box
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.scale = (2.0, 0.1, 0.1) # X=length, Y=depth, Z=height
    
    # Export
    out_path = os.path.join(output_dir, "side_skirt_01.glb")
    bpy.ops.export_scene.gltf(filepath=out_path)
    print(f"Created {out_path}")

def create_diffuser(output_dir):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Box with fins
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 0))
    base = bpy.context.active_object
    base.scale = (0.3, 0.8, 0.05)
    
    # Fins
    for i in range(4):
        y_pos = -0.3 + (i * 0.2)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, y_pos, -0.05))
        fin = bpy.context.active_object
        fin.scale = (0.2, 0.02, 0.1)
    
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.join()
    
    # Export
    out_path = os.path.join(output_dir, "rear_diffuser_01.glb")
    bpy.ops.export_scene.gltf(filepath=out_path)
    print(f"Created {out_path}")

if __name__ == "__main__":
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    if len(argv) < 1:
        print("Usage: blender --background --python generate_placeholders.py -- output_dir")
        sys.exit(1)
        
    output_dir = argv[0]
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    create_wheel(output_dir)
    create_front_lip(output_dir)
    create_side_skirt(output_dir)
    create_diffuser(output_dir)
