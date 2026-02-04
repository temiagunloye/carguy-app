import bpy
import os
import math
import sys

def setup_studio():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # 2. Infinite Floor (Cyclorama) - Dark Studio
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
    
    # 3. Lighting (High Contrast Studio)
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
    # We move the entire collection of selected objects
    if min_z != 9999.0:
        offset = -min_z
        # Also move slightly up to avoid z-fighting with shadow catcher
        offset += 0.002
        bpy.ops.transform.translate(value=(0, 0, offset))

def set_car_paint(color_rgb):
    # Apply to ALL materials that match heuristics
    applied_count = 0
    search_terms = ['paint', 'body', 'car', 'silver', 'metal', 'coat']
    
    for mat in bpy.data.materials:
        name_lower = mat.name.lower()
        # Check if any term is in the name
        if any(term in name_lower for term in search_terms):
            if mat.use_nodes:
                bsdf = mat.node_tree.nodes.get('Principled BSDF')
                if bsdf:
                    # Apply Color
                    bsdf.inputs['Base Color'].default_value = color_rgb + (1,)
                    
                    # Force Metallic/Roughness for "Manthey Green" premium look
                    bsdf.inputs['Metallic'].default_value = 0.8
                    bsdf.inputs['Roughness'].default_value = 0.2
                    
                    print(f"   [INFO] Applied paint to material: {mat.name}")
                    applied_count += 1
    
    if applied_count == 0:
        print("   [WARNING] No paint/body materials found to update!")
    else:
        print(f"   [INFO] Updated {applied_count} materials with new color.")

def render_angles(glb_path, output_dir, color_name=None, start_angle=0):
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    # Imports mathutils for bbox calc
    global mathutils
    import mathutils
    
    align_to_floor()
    
    # Apply Color Override if needed
    if color_name == 'yellow':
        set_car_paint((1.0, 0.8, 0.0)) # Racing Yellow
    elif color_name == 'white':
        set_car_paint((0.9, 0.9, 0.9)) # White
    elif color_name == 'green': # Manthey Reference
        set_car_paint((0.21, 0.27, 0.18)) # Oak Green / Olive (Approx)

    # Camera
    bpy.ops.object.camera_add(location=(0, -6.5, 1.4))
    cam = bpy.context.active_object
    cam.data.lens = 50 # 50mm focal length (Photo-realistic)
    bpy.context.scene.camera = cam
    
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 128
    scene.render.resolution_x = 1024 # High Res Square
    scene.render.resolution_y = 1024
    scene.render.film_transparent = True
    
    # Ensure output dir exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    
    for i in range(start_angle, 10):
        # Angle 0..9 -> 36 degrees step
        deg = i * 36
        rad = math.radians(deg)
        
        # Orbit logic
        radius = 6.5 # radius = 6.5
        x = radius * math.sin(rad)
        y = -radius * math.cos(rad)
        
        # Camera Position
        cam.location = (x, y, 1.6)
        
        # Look at target (Center of Car approx Z=0.55m)
        target = mathutils.Vector((0, 0, 0.55))
        direction = target - cam.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        cam.rotation_euler = rot_quat.to_euler()
        
        # Render
        scene.render.filepath = os.path.join(output_dir, f"angle_{i+1:02d}.png")
        print(f"Rendering Angle {i+1} to {scene.render.filepath}...")
        bpy.ops.render.render(write_still=True)

def set_car_paint(color_rgb):
    # Apply to ALL materials that match heuristics
    applied_count = 0
    search_terms = ['paint', 'body', 'car', 'silver', 'metal', 'coat']
    
    for mat in bpy.data.materials:
        name_lower = mat.name.lower()
        # Check if any term is in the name
        if any(term in name_lower for term in search_terms):
            if mat.use_nodes:
                bsdf = mat.node_tree.nodes.get('Principled BSDF')
                if bsdf:
                    # Apply Color
                    bsdf.inputs['Base Color'].default_value = color_rgb + (1,)
                    
                    # Force Metallic/Roughness for "Manthey Green" premium look
                    bsdf.inputs['Metallic'].default_value = 0.8
                    bsdf.inputs['Roughness'].default_value = 0.2
                    
                    print(f"   [INFO] Applied paint to material: {mat.name}")
                    applied_count += 1
    
    if applied_count == 0:
        print("   [WARNING] No paint/body materials found to update!")
    else:
        print(f"   [INFO] Updated {applied_count} materials with new color.")

# ... (render loop remains)

def mount_wheels(wheel_path):
    print(f"   [INFO] Mounting wheels from: {wheel_path}")
    # Import Wheel GLB
    bpy.ops.import_scene.gltf(filepath=wheel_path)
    
    # Smart selection: Prefer 'DemoWheel', ignore 'Cube'
    wheel_obj = None
    
    # First pass: Look for specific name
    for obj in bpy.context.selected_objects:
        if obj.type == 'MESH' and 'DemoWheel' in obj.name:
            wheel_obj = obj
            break
    
    # Second pass: If not found, take any mesh that ISN'T Cube
    if not wheel_obj:
        for obj in bpy.context.selected_objects:
            if obj.type == 'MESH' and 'Cube' not in obj.name:
                wheel_obj = obj
                break
            
    if not wheel_obj:
        print("   [ERROR] No valid wheel mesh found (Found only cubes or nothing).")
        return

    print(f"   [INFO] Selected wheel object: {wheel_obj.name} (Dims: {wheel_obj.dimensions})")

    # Coordinates (Approx 911 992)
    # Front: X +/- 0.82, Y 1.35, Z 0.33
    # Rear:  X +/- 0.85, Y -1.55, Z 0.34
    positions = [
        {"pos": (-0.82, 1.35, 0.33), "rot": (0, 0, 1.5708), "name": "FL"}, # Left: +90 deg
        {"pos": (0.82, 1.35, 0.33),  "rot": (0, 0, -1.5708), "name": "FR"}, # Right: -90 deg
        {"pos": (-0.88, -1.55, 0.34),"rot": (0, 0, 1.5708), "name": "RL"},
        {"pos": (0.88, -1.55, 0.34), "rot": (0, 0, -1.5708), "name": "RR"}
    ]
    
    # Scale up slightly (Aero discs are usually huge)
    wheel_obj.scale = (1.35, 1.35, 1.35) 
    
    # Create instances
    count = 0
    for p in positions:
        # Duplicate
        new_wheel = wheel_obj.copy()
        new_wheel.data = wheel_obj.data.copy()
        new_wheel.location = p["pos"]
        new_wheel.rotation_euler = p["rot"] # Z rotation
        
        # Fix Rotate X 90 if model is Y-up (likely needs 90 deg on X to stand up)
        # Checking dimensions (0.5, 0.5, 0.2) -> Z is thickness.
        # So we need to rotate 90 on X or Y to make it face outward.
        # Adding 90 deg rotation on X local axis
        new_wheel.rotation_euler.x += 1.5708 
        
        bpy.context.collection.objects.link(new_wheel)
        count += 1
        
    print(f"   [INFO] Successfully mounted {count} wheels.")
        
    # Hide original (Master)
    bpy.context.collection.objects.unlink(wheel_obj)

if __name__ == "__main__":
    args = sys.argv
    try:
        idx = args.index("--")
        glb_path = args[idx+1]
        output_dir = args[idx+2]
        color = args[idx+3] if len(args) > idx+3 else None
        start_angle = int(args[idx+4]) if len(args) > idx+4 else 0
        
        setup_studio()
        render_angles(glb_path, output_dir, color, start_angle)
    except ValueError:
        print("Usage: blender --python ... -- <glb> <out> [color] [start_angle]")
