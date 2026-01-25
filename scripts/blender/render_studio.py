import bpy
import os
import math
import sys

# Usage: blender --background --python render_studio.py -- <glb_path> <output_dir>

def setup_studio():
    # 1. Clear Scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # 2. Infinite Floor (Cyclorama)
    bpy.ops.mesh.primitive_plane_add(size=100, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = "StudioFloor"
    
    # Material: Shadow Catcher
    mat = bpy.data.materials.new(name="ShadowCatcher")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Alpha'].default_value = 0.0 # Invisible floor
    # Note: For shadow catcher in Eevee/Cycle, specific settings needed
    # For now, simplistic dark floor
    bsdf.inputs['Base Color'].default_value = (0.05, 0.05, 0.05, 1)
    bsdf.inputs['Roughness'].default_value = 0.9
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    plane.data.materials.append(mat)
    
    # 3. Lighting (3-Point Softbox)
    # Key Light
    bpy.ops.object.light_add(type='AREA', location=(5, -5, 5))
    key = bpy.context.active_object
    key.data.energy = 500
    key.data.size = 5
    
    # Fill Light
    bpy.ops.object.light_add(type='AREA', location=(-4, -4, 2))
    fill = bpy.context.active_object
    fill.data.energy = 200
    fill.data.size = 3
    
    # Rim Light
    bpy.ops.object.light_add(type='SPOT', location=(0, 5, 4))
    rim = bpy.context.active_object
    rim.data.energy = 800
    rim.rotation_euler = (math.radians(-45), 0, 0)
    
    return plane

def render_angles(glb_path, output_dir):
    # Import GLB
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    # Center the Car
    # (Naive centering: select all meshes, calculate bbox, move)
    # For now, assume model is at 0,0,0
    
    # Camera Setup
    bpy.ops.object.camera_add(location=(0, -7, 1.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(85), 0, 0)
    bpy.context.scene.camera = cam
    
    # Render Settings
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES' # High Quality
    scene.cycles.samples = 128
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.film_transparent = True # PNG Transparency
    
    # Define 10 Angles (Orbit around 0,0,0)
    # Logic: Move camera in circle
    angles = {
        'front': 0,
        'front_left': 45,
        'left': 90,
        'rear_left': 135,
        'rear': 180,
        'rear_right': 225,
        'right': 270,
        'front_right': 315
    }
    
    radius = 6.5
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for name, deg in angles.items():
        rad = math.radians(deg)
        x = radius * math.sin(rad)
        y = -radius * math.cos(rad)
        
        cam.location = (x, y, 1.6)
        
        # Point camera at origin
        # Simple look_at logic
        direction = -cam.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        cam.rotation_euler = rot_quat.to_euler()
        
        # Render
        scene.render.filepath = os.path.join(output_dir, f"{name}.png")
        print(f"Rendering {name}...")
        bpy.ops.render.render(write_still=True)

if __name__ == "__main__":
    args = sys.argv
    # blender args end after "--"
    try:
        idx = args.index("--")
        glb_path = args[idx+1]
        output_dir = args[idx+2]
        
        setup_studio()
        render_angles(glb_path, output_dir)
    except ValueError:
        print("Usage: blender --python render_studio.py -- <glb> <out>")
