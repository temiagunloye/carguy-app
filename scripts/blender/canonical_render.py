import bpy
import os
import math
import mathutils
import sys
import json
import time

# Usage: blender --background --python canonical_render.py -- <glb_path> <output_dir>

def setup_black_studio():
    # 1. Clear Scene
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    
    # 2. World Background (Dark Gradient)
    world = bpy.data.worlds.new("BlackStudioWorld")
    scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes['Background']
    bg.inputs['Color'].default_value = (0.01, 0.01, 0.01, 1) # Deep dark grey/black
    bg.inputs['Strength'].default_value = 1.0

    # 3. Infinite Floor (Shadow Catcher)
    bpy.ops.mesh.primitive_plane_add(size=100, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = "StudioFloor"
    plane.is_shadow_catcher = True # Cycles feature

    # Material: Shadow Catcher
    mat = bpy.data.materials.new(name="ShadowCatcherMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    out = nodes.new('ShaderNodeOutputMaterial')
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.005, 0.005, 0.005, 1) # Very dark floor
    bsdf.inputs['Roughness'].default_value = 0.4
    bsdf.inputs['Specular IOR Level'].default_value = 0.2
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    plane.data.materials.append(mat)
    
    # 4. Canonical Lighting ("Black Studio" - Soft Overhead + Rims)
    
    # Key Light (Large Softbox Top)
    bpy.ops.object.light_add(type='AREA', location=(0, 0, 8))
    top = bpy.context.active_object
    top.name = "Key_Top_Softbox"
    top.data.energy = 1200
    top.data.size = 10
    top.data.shape = 'RECTANGLE'
    top.data.size_y = 10
    
    # Fill Light (Front Right)
    bpy.ops.object.light_add(type='AREA', location=(5, -5, 3))
    fill = bpy.context.active_object
    fill.name = "Fill_Front"
    fill.data.energy = 400
    fill.data.size = 6
    
    # Rim Light 1 (Rear Left)
    bpy.ops.object.light_add(type='SPOT', location=(-4, 6, 3))
    rim1 = bpy.context.active_object
    rim1.name = "Rim_Rear_Left"
    rim1.data.energy = 1500
    rim1.data.spot_size = math.radians(60)
    # Point at center
    rim1.rotation_euler = (math.radians(-30), math.radians(-135), 0)

    # Rim Light 2 (Rear Right)
    bpy.ops.object.light_add(type='SPOT', location=(4, 6, 3))
    rim2 = bpy.context.active_object
    rim2.name = "Rim_Rear_Right"
    rim2.data.energy = 1500
    rim2.data.spot_size = math.radians(60)
    
    return plane

def render_canonical_set(glb_path, output_dir, paint_hex=None, paint_roughness=0.5):
    # Import GLB
    # Note: Ensure default rotation is handled. Blender Z-up vs GLB Y-up usually safe with importer.
    bpy.ops.import_scene.gltf(filepath=glb_path)
    
    # Configure Materials (if requested)
    if paint_hex:
        configure_materials(paint_hex, paint_roughness)
    
    # Camera Setup
    bpy.ops.object.camera_add(location=(0, -7, 1.6))
    cam = bpy.context.active_object
    cam.name = "CanonicalCam"
    cam.data.lens = 50 # 50mm focal length (consistent look)
    bpy.context.scene.camera = cam
    
    # Render Settings
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 256 # Higher quality
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080 
    scene.render.film_transparent = True
    
    # Define 10 Canonical Angles
    # Format: (Azimuth Deg, Elevation Deg, Distance)
    # Azimuth: 0 = Front, 90 = Left side (Driver), 180 = Rear, 270 = Right side (Pass)
    # Note: Blender camera placement requires converting spherical to cartesian
    
    # --- GEOMETRY NORMALIZATION (Fix Sinking) ---
    # Identify Car Objects (exclude Studio elements)
    car_objects = []
    studio_names = ["StudioFloor", "Key_Top_Softbox", "Fill_Front", "Rim_Rear_Left", "Rim_Rear_Right", "CanonicalCam"]
    
    for obj in bpy.context.visible_objects:
        if obj.name not in studio_names and obj.type == 'MESH':
            car_objects.append(obj)
            
    # Calculate bounding box of CAR objects only
    min_z = float('inf')
    for obj in car_objects:
        # local corners to global
        for corner in obj.bound_box:
            world_coord = obj.matrix_world @ mathutils.Vector(corner)
            if world_coord.z < min_z:
                min_z = world_coord.z
    
    # If the car is sinking (min_z < 0), move everything up
    if min_z != float('inf') and len(car_objects) > 0:
        offset_z = 0.0 - min_z
        # Add a tiny buffer so tires don't Z-fight with floor
        offset_z += 0.002 
        
        print(f"DEBUG: Adjusting Car Z-Height by {offset_z}m (Current Min Z: {min_z})")
        
        # Select ONLY car objects (roots)
        bpy.ops.object.select_all(action='DESELECT')
        for obj in bpy.context.visible_objects:
            if obj.name not in studio_names: # Select all car parts (mesh, empty, etc)
                if obj.parent is None:
                    obj.select_set(True)
        
        bpy.ops.transform.translate(value=(0, 0, offset_z))
    # ---------------------------------------------

    # Mapping "Front 3/4 driver" implies viewing the driver side and front.
    
    # Canonical List from Spec (Updated for Maximum Safety Framing):
    angles_spec = [
        {"id": "01", "name": "Front 3/4 (Driver)",       "az": 45,   "el": 15, "dist": 11.5}, 
        {"id": "02", "name": "Front",                    "az": 0,    "el": 12, "dist": 11.5},
        {"id": "03", "name": "Front 3/4 (Passenger)",    "az": 315,  "el": 15, "dist": 11.5},
        {"id": "04", "name": "Side (Passenger)",         "az": 270,  "el": 10, "dist": 11.5},
        {"id": "05", "name": "Rear 3/4 (Passenger)",     "az": 225,  "el": 15, "dist": 11.5},
        {"id": "06", "name": "Rear",                     "az": 180,  "el": 12, "dist": 11.5},
        {"id": "07", "name": "Rear 3/4 (Driver)",        "az": 135,  "el": 15, "dist": 11.5},
        {"id": "08", "name": "Side (Driver)",            "az": 90,   "el": 10, "dist": 11.5},
        {"id": "09", "name": "High Front 3/4 (Driver)",  "az": 45,   "el": 30, "dist": 12.5}, # Higher/Further
        {"id": "10", "name": "Low Rear 3/4 (Passenger)", "az": 225,  "el": 5,  "dist": 10.5}  # Lower/Closer
    ]
    
    manifest_angles = []
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    for item in angles_spec:
        # Calculate Camera Pos
        theta = math.radians(item["az"])
        phi = math.radians(item["el"])
        r = item["dist"]
        
        # Z-up Spherical
        # x = r * cos(phi) * sin(theta)
        # y = -r * cos(phi) * cos(theta) (because Front is 0 deg at -Y axis usually)
        # z = r * sin(phi)
        
        x = r * math.cos(phi) * math.sin(theta)
        y = -r * math.cos(phi) * math.cos(theta)
        z = r * math.sin(phi)
        
        cam.location = (x, y, z)
        
        # Track to origin
        direction = -cam.location
        rot_quat = direction.to_track_quat('-Z', 'Y')
        cam.rotation_euler = rot_quat.to_euler()
        
        # Render
        filename = f"angle_{item['id']}.png"
        filepath = os.path.join(output_dir, filename)
        
        scene.render.filepath = filepath
        print(f"Rendering {item['name']} -> {filename}...")
        
        # Check if file exists to skip? No, user ordered Regeneration.
        bpy.ops.render.render(write_still=True)
        
        manifest_angles.append({
            "angleId": item["id"],
            "filename": filename,
            "label": item["name"],
            "camera": { "azimuth": item["az"], "elevation": item["el"], "distance": item["dist"] }
        })

    # Generate Manifest
    manifest = {
        "createdAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "sourceModel": os.path.basename(glb_path),
        "angleCount": 10,
        "specVersion": "2.0 (Canonical Black Studio)",
        "paintConfig": { "hex": paint_hex, "roughness": paint_roughness } if paint_hex else "original",
        "angles": manifest_angles
    }
    
    with open(os.path.join(output_dir, "manifest.json"), 'w') as f:
        json.dump(manifest, f, indent=2)

def hex_to_rgb(hex_str):
    hex_str = hex_str.lstrip('#')
    return tuple(int(hex_str[i:i+2], 16)/255.0 for i in (0, 2, 4)) + (1.0,)

def configure_materials(paint_hex, paint_roughness):
    if not paint_hex:
        return
        
    print(f"Configuring Paint: {paint_hex} (Roughness: {paint_roughness})")
    rgba = hex_to_rgb(paint_hex)
    
    # Heuristic: Find material with "Paint", "Body", "Car" in name
    target_mats = []
    for mat in bpy.data.materials:
        name_lower = mat.name.lower()
        if "paint" in name_lower or "body" in name_lower or "car" in name_lower:
            # Exclude obvious non-body things if needed (e.g. "underbody")
            if "glass" not in name_lower and "window" not in name_lower:
                target_mats.append(mat)
    
    if not target_mats:
        print("WARNING: No 'Paint' material found. Trying to apply to largest mesh...")
        # Fallback logic could go here
        return

    for mat in target_mats:
        print(f"Overriding Material: {mat.name}")
        if not mat.use_nodes:
            mat.use_nodes = True
        
        nodes = mat.node_tree.nodes
        bsdf = None
        for n in nodes:
            if n.type == 'BSDF_PRINCIPLED':
                bsdf = n
                break
        
        if bsdf:
            bsdf.inputs['Base Color'].default_value = rgba
            bsdf.inputs['Roughness'].default_value = float(paint_roughness)
            bsdf.inputs['Metallic'].default_value = 0.7 if float(paint_roughness) < 0.5 else 0.1
            
            # Robust Clearcoat handling for Blender 3.x vs 4.x
            coat_val = 1.0 if float(paint_roughness) < 0.3 else 0.0
            if 'Clearcoat' in bsdf.inputs:
                bsdf.inputs['Clearcoat'].default_value = coat_val
            elif 'Coat Weight' in bsdf.inputs:
                bsdf.inputs['Coat Weight'].default_value = coat_val
            elif 'Coat' in bsdf.inputs:
                bsdf.inputs['Coat'].default_value = coat_val

if __name__ == "__main__":
    # Usage: blender --python script.py -- <glb> <out> [paint_hex] [roughness]
    args = sys.argv
    try:
        idx = args.index("--")
        glb_path = args[idx+1]
        output_dir = args[idx+2]
        
        paint_hex = None
        paint_roughness = 0.5
        
        if len(args) > idx + 3:
            paint_hex = args[idx+3]
        if len(args) > idx + 4:
            paint_roughness = float(args[idx+4])
        
        setup_black_studio()
        render_canonical_set(glb_path, output_dir, paint_hex, paint_roughness)
    except ValueError:
        print("Usage: blender --python canonical_render.py -- <glb> <out> [hex] [rough]")
