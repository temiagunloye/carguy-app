import bpy
import os
import math
import sys

def setup_studio():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Infinite Floor (Cyclorama) - Dark Studio
    bpy.ops.mesh.primitive_plane_add(size=100, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = "StudioFloor"
    
    mat = bpy.data.materials.new(name="ShadowCatcher")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.05, 0.05, 0.05, 1) # Dark Grey
    bsdf.inputs['Roughness'].default_value = 0.4
    bsdf.inputs['Specular IOR Level'].default_value = 0.2
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    plane.data.materials.append(mat)
    
    # Lighting (High Contrast Studio)
    # Key
    bpy.ops.object.light_add(type='AREA', location=(4, -4, 5))
    key = bpy.context.active_object
    key.data.energy = 800
    key.data.size = 5
    
    # Fill
    bpy.ops.object.light_add(type='AREA', location=(-3, -3, 3))
    fill = bpy.context.active_object
    fill.data.energy = 300
    fill.data.size = 4
    
    # Rim (Backlight)
    bpy.ops.object.light_add(type='AREA', location=(0, 5, 4))
    rim = bpy.context.active_object
    rim.data.energy = 1000
    rim.data.size = 6
    rim.rotation_euler = (math.radians(-60), 0, 0)
    
    # Top Light (Softbox)
    bpy.ops.object.light_add(type='AREA', location=(0, 0, 6))
    top = bpy.context.active_object
    top.data.energy = 400
    top.data.size = 8
    
    return plane

def align_to_floor():
    import mathutils
    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')
    
    # Select all meshes
    for obj in bpy.data.objects:
        if obj.type == 'MESH' and obj.name != "StudioFloor":
            obj.select_set(True)
            
    # Calculate Bounding Box
    min_z = 9999.0
    for obj in bpy.context.selected_objects:
        # Get world matrix coordinates
        bbox = [obj.matrix_world @ mathutils.Vector(b) for b in obj.bound_box]
        z_coords = [v.z for v in bbox]
        min_z = min(min_z, min(z_coords))
        
    # Move Up
    if min_z != 9999.0:
        offset = -min_z
        # Slightly up to avoid z-fighting
        offset += 0.002
        bpy.ops.transform.translate(value=(0, 0, offset))

def calculate_camera_distance():
    """Calculate optimal camera distance based on car bounding box"""
    import mathutils
    
    # Get all car meshes (exclude floor)
    car_objects = [obj for obj in bpy.data.objects if obj.type == 'MESH' and obj.name != "StudioFloor"]
    
    if not car_objects:
        return 6.5  # Default
    
    # Calculate combined bounding box
    min_x = min_y = min_z = 9999.0
    max_x = max_y = max_z = -9999.0
    
    for obj in car_objects:
        bbox = [obj.matrix_world @ mathutils.Vector(b) for b in obj.bound_box]
        for v in bbox:
            min_x = min(min_x, v.x)
            max_x = max(max_x, v.x)
            min_y = min(min_y, v.y)
            max_y = max(max_y, v.y)
            min_z = min(min_z, v.z)
            max_z = max(max_z, v.z)
    
    # Calculate dimensions
    width = max_x - min_x
    length = max_y - min_y
    height = max_z - min_z
    
    # Use the larger of width/length to determine distance
    max_dim = max(width, length)
    
    # Distance formula: ensure car fills 70-80% of frame
    # For 50mm lens, this works well
    distance = max_dim * 2.2
    
    # Clamp between reasonable values
    distance = max(4.0, min(8.0, distance))
    
    print(f"[INFO] Car dimensions: {width:.2f}w x {length:.2f}l x {height:.2f}h")
    print(f"[INFO] Calculated camera distance: {distance:.2f}")
    
    return distance

def set_car_color(color_rgb, metallic, roughness, specular=0.5):
    """Apply color to all car body materials"""
    applied_count = 0
    search_terms = ['paint', 'body', 'car', 'silver', 'metal', 'coat']
    
    for mat in bpy.data.materials:
        name_lower = mat.name.lower()
        if any(term in name_lower for term in search_terms):
            if mat.use_nodes:
                bsdf = mat.node_tree.nodes.get('Principled BSDF')
                if bsdf:
                    bsdf.inputs['Base Color'].default_value = color_rgb + (1,)
                    bsdf.inputs['Metallic'].default_value = metallic
                    bsdf.inputs['Roughness'].default_value = roughness
                    bsdf.inputs['Specular IOR Level'].default_value = specular
                    print(f"[INFO] Applied color to: {mat.name}")
                    applied_count += 1
    
    print(f"[INFO] Updated {applied_count} materials")

def render_angles(glb_path, output_dir, color_rgb, metallic, roughness):
    import mathutils
    
    print(f"[INFO] Importing car from: {glb_path}")
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    align_to_floor()
    set_car_color(color_rgb, metallic, roughness)
    
    # Calculate optimal camera distance
    radius = calculate_camera_distance()
    
    # Camera setup
    bpy.ops.object.camera_add(location=(0, -radius, 1.4))
    cam = bpy.context.active_object
    cam.data.lens = 50
    bpy.context.scene.camera = cam
    
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 128
    scene.render.resolution_x = 1024
    scene.render.resolution_y = 1024
    scene.render.film_transparent = True
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for i in range(10):
        deg = i * 36
        rad = math.radians(deg)
        
        x = radius * math.sin(rad)
        y = -radius * math.cos(rad)
        
        cam.location = (x, y, 1.6)
        
        target = mathutils.Vector((0, 0, 0.55))
        direction = target - cam.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        cam.rotation_euler = rot_quat.to_euler()
        
        scene.render.filepath = os.path.join(output_dir, f"angle_{i+1:02d}.png")
        print(f"[RENDER] Angle {i+1}/10 -> {scene.render.filepath}")
        bpy.ops.render.render(write_still=True)

if __name__ == "__main__":
    args = sys.argv
    try:
        idx = args.index("--")
        glb_path = args[idx+1]
        output_dir = args[idx+2]
        
        # Color as 3 floats
        r = float(args[idx+3])
        g = float(args[idx+4])
        b = float(args[idx+5])
        metallic = float(args[idx+6])
        roughness = float(args[idx+7])
        
        setup_studio()
        render_angles(glb_path, output_dir, (r, g, b), metallic, roughness)
    except (ValueError, IndexError) as e:
        print(f"Error: {e}")
        print("Usage: blender --python render_custom_build.py -- <glb> <out_dir> <r> <g> <b> <metallic> <roughness>")
