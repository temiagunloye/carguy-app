"""
BLENDER GOLD STANDARD STUDIO RIG - Base Model Renderer
Matches PDF quality reference (dark gradient + consistent lighting + subtle reflection)

Usage:
    blender --background --python render_base_models.py -- \
        --glb /path/to/model.glb \
        --build-id m3_2023_stock_alpine_white \
        --color alpine_white \
        --output base_model_renders/m3_2023_stock_alpine_white

Requirements:
    - Blender 3.0+
    - GLB model files
"""

import bpy
import math
import json
import os
import sys
from pathlib import Path
from datetime import datetime
from mathutils import Vector, Euler

# ============================================================================
# CONFIGURATION - MATCHES PDF STYLE LOCK
# ============================================================================

RENDER_CONFIG = {
    'resolution_x': 1920,
    'resolution_y': 1080,
    'samples': 128,  # EEVEE samples
    'engine': 'BLENDER_EEVEE',
    'use_ssr': True,
    'use_ao': True,
    'use_soft_shadows': True,
    'file_format': 'PNG',
    'color_mode': 'RGBA',
    'color_depth': '16',
}

# Camera settings for "premium product photography" look
CAMERA_CONFIG = {
    'lens': 85,  # Moderate telephoto (reduces distortion)
    'sensor_width': 36,
    'clip_start': 0.1,
    'clip_end': 1000,
    'distance_from_car': 8.0,  # Adjust based on car size for 60-70% framing
}

# 10-angle rotation order (locked per spec)
CAMERA_ANGLES = [
    {'name': 'angle_01', 'rotation': 150, 'elevation': 12, 'desc': 'Front 3/4 driver'}, # 30 deg offset from front (180 is front)
    {'name': 'angle_02', 'rotation': 180, 'elevation': 8, 'desc': 'Front'},
    {'name': 'angle_03', 'rotation': 210, 'elevation': 12, 'desc': 'Front 3/4 passenger'},
    {'name': 'angle_04', 'rotation': 270, 'elevation': 8, 'desc': 'Side passenger'},
    {'name': 'angle_05', 'rotation': 330, 'elevation': 12, 'desc': 'Rear 3/4 passenger'},
    {'name': 'angle_06', 'rotation': 0, 'elevation': 10, 'desc': 'Rear'},
    {'name': 'angle_07', 'rotation': 30, 'elevation': 12, 'desc': 'Rear 3/4 driver'},
    {'name': 'angle_08', 'rotation': 90, 'elevation': 8, 'desc': 'Side driver'},
    {'name': 'angle_09', 'rotation': 150, 'elevation': 25, 'desc': 'High front 3/4 driver'},
    {'name': 'angle_10', 'rotation': 30, 'elevation': 5, 'desc': 'Low rear 3/4 passenger'},
]

# Paint material definitions - TUNED FOR PDF REALISM
PAINT_COLORS = {
    'alpine_white': {
        'base_color': (0.95, 0.95, 0.95, 1.0),
        'metallic': 0.0,
        'roughness': 0.25,
        'specular': 0.55,
        'clearcoat': 0.65,
        'clearcoat_roughness': 0.03,
    },
    'nardo_grey': {
        'base_color': (0.45, 0.45, 0.47, 1.0),
        'metallic': 0.0,
        'roughness': 0.35,
        'specular': 0.50,
        'clearcoat': 0.40,
        'clearcoat_roughness': 0.05,
    },
    'obsidian_black': {
        'base_color': (0.01, 0.01, 0.015, 1.0),
        'metallic': 0.0,
        'roughness': 0.20,
        'specular': 0.60,
        'clearcoat': 0.70,
        'clearcoat_roughness': 0.03,
    },
    'guards_red': {
        'base_color': (0.8, 0.02, 0.02, 1.0),
        'metallic': 0.0,
        'roughness': 0.24,
        'specular': 0.55,
        'clearcoat': 0.65,
        'clearcoat_roughness': 0.04,
    },
     'neptune_blue': {
        'base_color': (0.1, 0.25, 0.6, 1.0),
        'metallic': 0.8,
        'roughness': 0.15,
        'specular': 0.5,
        'clearcoat': 0.7,
        'clearcoat_roughness': 0.05,
    },
}


# ============================================================================
# STUDIO RIG SETUP (GOLD STANDARD - MATCHES PDF)
# ============================================================================

def setup_world_background():
    """
    Create dark gradient studio background matching PDF style.
    Use simple planes to avoid cyclorama hangs.
    """
    world = bpy.context.scene.world
    world.use_nodes = True
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()
    
    bg = nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.01, 0.01, 0.015, 1.0)
    bg.inputs['Strength'].default_value = 0.5 # Dim ambient
    
    out = nodes.new('ShaderNodeOutputWorld')
    links.new(bg.outputs['Background'], out.inputs['Surface'])
    
    # Backdrop Plane (Infinite Wall Look)
    bpy.ops.mesh.primitive_plane_add(size=100, location=(0, 40, 50))
    wall = bpy.context.active_object
    wall.name = "BackdropWall"
    wall.rotation_euler = (math.radians(90), 0, 0)
    
    mat = bpy.data.materials.new(name="BackdropMaterial")
    mat.use_nodes = True
    w_nodes = mat.node_tree.nodes
    w_links = mat.node_tree.links
    w_nodes.clear()
    
    tex = w_nodes.new('ShaderNodeTexCoord')
    grad = w_nodes.new('ShaderNodeTexGradient')
    grad.gradient_type = 'QUADRATIC_SPHERE'
    ramp = w_nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color = (0.1, 0.1, 0.12, 1.0) # Center glow
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color = (0.01, 0.01, 0.01, 1.0) # Edges dark
    
    bsdf = w_nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0, 0, 0, 1.0)
    bsdf.inputs['Emission Color'].default_value = (1, 1, 1, 1.0)
    
    out_m = w_nodes.new('ShaderNodeOutputMaterial')
    
    w_links.new(tex.outputs['Window'], grad.inputs['Vector'])
    w_links.new(grad.outputs['Color'], ramp.inputs['Fac'])
    w_links.new(ramp.outputs['Color'], bsdf.inputs['Emission Color'])
    w_links.new(bsdf.outputs['BSDF'], out_m.inputs['Surface'])
    
    wall.data.materials.append(mat)
    print("✓ Studio backdrop gradient created")


def setup_studio_floor():
    """
    Create studio floor with subtle blurred reflection.
    """
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "StudioFloor"
    
    mat = bpy.data.materials.new(name="FloorMaterial")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value = (0.05, 0.05, 0.06, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.15 # Blurred reflection, premium feel
    bsdf.inputs['Specular IOR Level'].default_value = 0.5
    
    out = nodes.new('ShaderNodeOutputWorld') # Error in previous, should be MaterialOutput
    out = nodes.new('ShaderNodeOutputMaterial')
    mat.node_tree.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    
    floor.data.materials.append(mat)
    print("✓ Studio floor created (subtle reflection)")
    return floor


def setup_studio_lighting():
    """
    Premium 3-point softbox setup + Rim light.
    LOCKED positions for all cars to ensure consistency.
    """
    # Remove existing
    for obj in bpy.data.objects:
        if obj.type == 'LIGHT' or obj.name.startswith("ReflectionProbe"):
            bpy.data.objects.remove(obj, do_unlink=True)
    
    lights = []
    
    # 1. KEY LIGHT: Large Softbox (Front-Left, High)
    key_light = bpy.data.lights.new(name="Softbox_Key", type='AREA')
    key_light.energy = 1500 # Boosted for vividness
    key_light.size = 12.0
    key_obj = bpy.data.objects.new(name="Softbox_Key", object_data=key_light)
    bpy.context.collection.objects.link(key_obj)
    key_obj.location = (10, -12, 8)
    key_obj.rotation_euler = (math.radians(55), 0, math.radians(-35))
    lights.append(key_obj)
    
    # 2. FILL LIGHT: Medium Softbox (Front-Right, Low)
    fill_light = bpy.data.lights.new(name="Softbox_Fill", type='AREA')
    fill_light.energy = 800 # Boosted
    fill_light.size = 8.0
    fill_obj = bpy.data.objects.new(name="Softbox_Fill", object_data=fill_light)
    bpy.context.collection.objects.link(fill_obj)
    fill_obj.location = (-10, -8, 4)
    fill_obj.rotation_euler = (math.radians(45), 0, math.radians(40))
    lights.append(fill_obj)
    
    # 3. RIM LIGHT: Strip light (Behind, Critical for separation)
    rim_light = bpy.data.lights.new(name="Softbox_Rim", type='AREA')
    rim_light.shape = 'RECTANGLE'
    rim_light.energy = 2500 # Major pop for edge separation
    rim_light.size = 20.0  # size_x
    rim_light.size_y = 2.0
    rim_obj = bpy.data.objects.new(name="Softbox_Rim", object_data=rim_light)
    bpy.context.collection.objects.link(rim_obj)
    rim_obj.location = (0, 15, 6)
    rim_obj.rotation_euler = (math.radians(-110), 0, 0)
    lights.append(rim_obj)
    
    # EEVEE REFLECTION PROBE
    bpy.ops.object.lightprobe_add(type='PLANE', radius=15, location=(0,0,0.02))
    probe = bpy.context.active_object
    probe.name = "ReflectionProbe_Floor"
    probe.scale = (25, 25, 1)
    
    print(f"✓ Premium 3-point softbox rig created ({len(lights)} lights)")
    return lights


def setup_camera():
    """
    Create camera with premium product photography settings and stable orbit rig.
    """
    # Remove existing
    objects_to_remove = ["ProductCamera", "OrbitCenter", "CameraOrbit"]
    for name in objects_to_remove:
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name], do_unlink=True)
            
    # 1. Orbit Center Empty
    target = bpy.data.objects.new("OrbitCenter", None)
    bpy.context.collection.objects.link(target)
    target.location = (0, 0, 0.8) # Focus point slightly above floor
    
    # 2. Camera Data
    camera_data = bpy.data.cameras.new(name='ProductCamera')
    camera_data.lens = 85
    camera_data.sensor_width = 36
    camera_data.clip_start = 0.1
    camera_data.clip_end = 1000
    
    camera_obj = bpy.data.objects.new('ProductCamera', camera_data)
    bpy.context.collection.objects.link(camera_obj)
    
    # 3. Track Constraint
    track = camera_obj.constraints.new(type='TRACK_TO')
    track.target = target
    track.track_axis = 'TRACK_NEGATIVE_Z'
    track.up_axis = 'UP_Y'
    
    bpy.context.scene.camera = camera_obj
    print("✓ Camera rig created (85mm, Auto-track)")
    return camera_obj, target


def delete_bad_stuff():
    """
    MANDATORY: Remove watermarks and bad geometry.
    """
    print("\nScanning for watermarks/trash...")
    bad_keywords = ["p3dm", "ru", "watermark", "text", "logo", "plane_text", "decal"]
    removed_count = 0
    
    # 1. Objects
    for obj in bpy.data.objects:
        if any(key in obj.name.lower() for key in bad_keywords):
            print(f"  → Deleting bad object: {obj.name}")
            bpy.data.objects.remove(obj, do_unlink=True)
            removed_count += 1
            
    # 2. Materials
    for mat in bpy.data.materials:
        if any(key in mat.name.lower() for key in bad_keywords):
            print(f"  → Neutering bad material: {mat.name}")
            mat.use_nodes = True
            mat.node_tree.nodes.clear() # Blank out
            removed_count += 1
            
    # 3. Images
    for img in bpy.data.images:
        if any(key in img.name.lower() for key in bad_keywords) or any(key in img.filepath.lower() for key in bad_keywords):
            print(f"  → Removing bad image: {img.name}")
            bpy.data.images.remove(img, do_unlink=True)
            removed_count += 1
            
    print(f"✓ Trash cleanup complete ({removed_count} items removed)")


# ============================================================================
# CAR MODEL HANDLING
# ============================================================================

def import_glb(glb_path):
    """Import GLB model and return the imported objects."""
    print(f"Importing GLB: {glb_path}")
    
    before_import = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=glb_path)
    after_import = set(bpy.context.scene.objects)
    
    imported_objects = list(after_import - before_import)
    
    if not imported_objects:
        raise RuntimeError(f"No objects imported from {glb_path}")
    
    print(f"✓ Imported {len(imported_objects)} objects")
    return imported_objects


def center_and_scale_car(car_objects):
    """
    Center car at origin and optionally scale for consistent framing.
    Returns the root parent object.
    """
def get_full_bounding_box(objects):
    """
    Compute precise bounding box of all mesh objects in world space.
    """
    bpy.context.view_layer.update()
    meshes = [obj for obj in objects if obj.type == 'MESH']
    if not meshes: return None, None
    
    min_co = Vector((float('inf'), float('inf'), float('inf')))
    max_co = Vector((float('-inf'), float('-inf'), float('-inf')))
    
    found_vert = False
    for obj in meshes:
        matrix = obj.matrix_world
        for v in obj.data.vertices:
            world_co = matrix @ v.co
            for i in range(3):
                min_co[i] = min(min_co[i], world_co[i])
                max_co[i] = max(max_co[i], world_co[i])
            found_vert = True
            
    if not found_vert: return None, None
    
    center = (min_co + max_co) / 2
    dims = max_co - min_co
    return center, dims, min_co, max_co


def detect_orientation(objects):
    """
    Detects the UP vector using surface normal area analysis.
    """
    area_bins = {
        'x+': 0, 'x-': 0,
        'y+': 0, 'y-': 0,
        'z+': 0, 'z-': 0,
    }
    
    for obj in objects:
        if obj.type != 'MESH': continue
        matrix = obj.matrix_world.to_3x3()
        for poly in obj.data.polygons:
            area = poly.area
            normal = (matrix @ poly.normal).normalized()
            
            # Bin the normal
            if abs(normal.x) > 0.8: area_bins['x+' if normal.x > 0 else 'x-'] += area
            elif abs(normal.y) > 0.8: area_bins['y+' if normal.y > 0 else 'y-'] += area
            elif abs(normal.z) > 0.8: area_bins['z+' if normal.z > 0 else 'z-'] += area
            
    # The 'UP' axis is the bin with the most area (Roof/Hood/Trunk)
    up_axis_key = max(area_bins, key=area_bins.get)
    print(f"  → Detected UP direction: {up_axis_key} (Area: {area_bins[up_axis_key]:.2f})")
    
    # Map key to vector
    key_map = {
        'x+': Vector((1,0,0)), 'x-': Vector((-1,0,0)),
        'y+': Vector((0,1,0)), 'y-': Vector((0,-1,0)),
        'z+': Vector((0,0,1)), 'z-': Vector((0,0,-1)),
    }
    return key_map[up_axis_key]


def is_upside_down_geometry(objects, z_min, z_max):
    """
    Pure geometric inversion check based on 'Top-Tapering'.
    A car's upper section (roof) is significantly more centralized (lower XY spread)
    than its lower section (wheels/chassis).
    """
    top_verts = []
    bottom_verts = []
    
    # Analyze the extremes
    threshold_low = z_min + (z_max - z_min) * 0.15 # Bottom 15% (Tires/Chassis)
    threshold_high = z_min + (z_max - z_min) * 0.85 # Top 15% (Roof)
    
    for obj in objects:
        if obj.type != 'MESH': continue
        mat = obj.matrix_world
        for v in obj.data.vertices:
            world_v = mat @ v.co
            if world_v.z > threshold_high:
                top_verts.append(world_v)
            elif world_v.z < threshold_low:
                bottom_verts.append(world_v)
                
    if len(top_verts) < 10 or len(bottom_verts) < 10:
        print("    ⚠ Geometry Check: Insufficient vertex data at extremes, skipping...")
        return False
        
    def get_xy_spread(verts):
        avg_x = sum(v.x for v in verts) / len(verts)
        avg_y = sum(v.y for v in verts) / len(verts)
        # Root mean square distance from centroid in XY plane
        rms_dist = math.sqrt(sum((v.x - avg_x)**2 + (v.y - avg_y)**2 for v in verts) / len(verts))
        return rms_dist
        
    top_spread = get_xy_spread(top_verts)
    bottom_spread = get_xy_spread(bottom_verts)
    
    print(f"  → Geometry Check: Top Spread: {top_spread:.2f} | Bottom Spread: {bottom_spread:.2f}")
    
    # If the 'Top' has a larger spread than the 'Bottom', it's actually the wheels being on top.
    # We use a 1.2x buffer to avoid false positives on very blocky vehicles.
    if top_spread > bottom_spread * 1.1:
        print("    → TOP is wider than BOTTOM. Model is UPSIDE DOWN. Triggering flip.")
        return True
    
    print("    → BOTTOM is wider than TOP. Orientation is correct.")
    return False


def is_facing_backward(objects, center_y):
    """
    Automotive-aware front/back detection.
    Headlights and grilles are usually more dense and specifically named.
    """
    front_keys = ["headlight", "lamp_f", "front_bumper", "grille", "fascia_f", "hood", "windshield", "steering"]
    rear_keys = ["taillight", "lamp_r", "rear_bumper", "exhaust", "muffler", "trunk", "boot", "spoiler", "diffuser_r"]
    
    front_vertices_y = []
    rear_vertices_y = []
    
    for obj in objects:
        if obj.type != 'MESH': continue
        name = obj.name.lower()
        
        is_front = any(k in name for k in front_keys)
        is_rear = any(k in name for k in rear_keys)
        
        # Check material slots too
        if not is_front and not is_rear:
            for slot in obj.material_slots:
                if not slot.material: continue
                mname = slot.material.name.lower()
                if any(k in mname for k in front_keys): is_front = True; break
                if any(k in mname for k in rear_keys): is_rear = True; break
        
        if is_front:
            matrix = obj.matrix_world
            for i in range(min(30, len(obj.data.vertices))):
                front_vertices_y.append((matrix @ obj.data.vertices[i].co).y)
        if is_rear:
            matrix = obj.matrix_world
            for i in range(min(30, len(obj.data.vertices))):
                rear_vertices_y.append((matrix @ obj.data.vertices[i].co).y)
                
    if not front_vertices_y and not rear_vertices_y:
        print("    ⚠ Direction Check: No front/rear parts identified, skipping direction flip...")
        return False
        
    avg_front_y = sum(front_vertices_y) / len(front_vertices_y) if front_vertices_y else 0
    avg_rear_y = sum(rear_vertices_y) / len(rear_vertices_y) if rear_vertices_y else 0
    
    # In our camera system, we want the car facing Positive Y.
    # If the 'Front' parts are at a lower Y than the 'Rear' parts, it's facing Negative Y.
    if front_vertices_y and rear_vertices_y:
        if avg_front_y < avg_rear_y:
            print(f"  → Direction Check: Front ({avg_front_y:.2f}) < Rear ({avg_rear_y:.2f}). Car is facing BACKWARD (-Y).")
            return True
    elif front_vertices_y:
        if avg_front_y < center_y:
            print(f"  → Direction Check: Front ({avg_front_y:.2f}) is BELOW center Y ({center_y:.2f}). Car is facing BACKWARD (-Y).")
            return True
            
    print("  → Direction Check: Orientation is correctly facing Forward (+Y).")
    return False


def apply_paint_override(objects, color_name):
    """
    STRICT surgical paint override: ONLY body panels.
    Enhanced with area-based slot targeting and broader keyword matching.
    """
    if color_name not in PAINT_COLORS:
        print(f"⚠ Color '{color_name}' not found")
        return
    
    spec = PAINT_COLORS[color_name]
    paint_mat = bpy.data.materials.new(name=f"CAR_PAINT_{color_name.upper()}")
    paint_mat.use_nodes = True
    bsdf = paint_mat.node_tree.nodes.get("Principled BSDF")
    
    bsdf.inputs['Base Color'].default_value = spec['base_color']
    bsdf.inputs['Metallic'].default_value = spec['metallic']
    bsdf.inputs['Roughness'].default_value = spec['roughness']
    bsdf.inputs['Specular IOR Level'].default_value = spec.get('specular', 0.5)
    
    # EEVEE Next Coat
    if 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = spec.get('clearcoat', 0.6)
        bsdf.inputs['Coat Roughness'].default_value = spec.get('clearcoat_roughness', 0.05)
    
    # Strict Selectors
    body_keys = ["body", "paint", "carpaint", "exterior", "coat", "clearcoat", "panel", "shell", "skin", "frame", "bumper", "door", "hood", "trunk", "roof", "fender", "spoiler", "mirror_cap", "caliper"]
    skip_keys = ["glass", "window", "tire", "rubber", "interior", "trim", "chrome", "light", "headlamp", "tail", "emissive", "reflector", "plastic", "brake", "engine", "exhaust", "wheel", "rim", "carbon", "grille", "handle", "emblem", "logo", "disk", "undercarriage"]
    
    target_slots = []
    
    # 1. Keyword Match
    for obj in objects:
        if obj.type != 'MESH': continue
        for slot in obj.material_slots:
            if not slot.material: continue
            name = slot.material.name.lower()
            if any(k in name for k in body_keys) and not any(s in name for s in skip_keys):
                target_slots.append(slot)
                
    # 2. Fallback: Area-based (Top 10 Slots by Surface Area)
    if not target_slots:
        print("  → No keyword matches, calculating top material slots by surface area...")
        slot_areas = {}
        for obj in objects:
            if obj.type != 'MESH': continue
            if any(s in obj.name.lower() for s in skip_keys): continue
            
            for i, slot in enumerate(obj.material_slots):
                if not slot.material: continue
                if any(s in slot.material.name.lower() for s in skip_keys): continue
                
                # Calculate area for this specific material slot in this object
                area = sum(p.area for p in obj.data.polygons if p.material_index == i)
                slot_key = (obj.name, i)
                slot_areas[slot_key] = (slot, area)
        
        # Pick top 8 largest slots (cars usually have many panels)
        sorted_slots = sorted(slot_areas.values(), key=lambda x: x[1], reverse=True)
        for slot, area in sorted_slots[:8]:
            if area > 0.01: # Avoid tiny parts
                print(f"    → Targeting high-area slot: {slot.material.name} ({area:.2f} sqm)")
                target_slots.append(slot)
                        
    # Apply
    applied_count = 0
    for slot in target_slots:
        slot.material = paint_mat
        applied_count += 1
        
    print(f"✓ Surgical paint applied to {applied_count} slots.")


# ============================================================================
# RENDERING
# ============================================================================

def position_camera(target_obj, angle_config, car_dims):
    """
    Orbit camera around target using bounding box for auto-distance.
    """
    camera = bpy.context.scene.camera
    yaw = math.radians(angle_config['rotation'])
    pitch = math.radians(angle_config['elevation'])
    
    # Auto-distance: Diagonal of bounding box * multiplier
    diag = car_dims.length
    distance = diag * 2.15 # Fills ~45% of frame (More breathing room, matches BRZ)
    
    # Spherical to Cartesian (Z-up)
    # Note: 0 rotation is front-facing (negative Y)
    x = distance * math.cos(pitch) * math.sin(yaw)
    y = -distance * math.cos(pitch) * math.cos(yaw)
    z = distance * math.sin(pitch) + target_obj.location.z # Offset by target height
    
    camera.location = (x, y, z)
    # Track constraint handles rotation automatically


def render_all_angles(output_dir, car_center, build_id, year, make, model, trim, paint_name, wheel_name, args={}):
    """
    Render all 10 angles and generate manifest.
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    camera = bpy.context.scene.camera
    scene = bpy.context.scene
    
    # Configure render settings for EEVEE Next REALISM
    scene.render.engine = 'BLENDER_EEVEE'
    scene.eevee.taa_render_samples = RENDER_CONFIG['samples']
    
    # Realism Toggles
    if hasattr(scene.eevee, "use_raytracing"):
        scene.eevee.use_raytracing = True # EEVEE NEXT
    
    if hasattr(scene.eevee, "use_fast_gi"):
        scene.eevee.use_fast_gi = True
        scene.eevee.fast_gi_method = 'AMBIENT_OCCLUSION_ONLY'
        
    scene.eevee.use_shadows = True
    scene.render.use_high_quality_normals = True
    
    # Resolution & Output
    scene.render.resolution_x = RENDER_CONFIG['resolution_x']
    scene.render.resolution_y = RENDER_CONFIG['resolution_y']
    scene.render.image_settings.file_format = RENDER_CONFIG['file_format']
    scene.render.image_settings.color_mode = RENDER_CONFIG['color_mode']
    scene.render.image_settings.color_depth = RENDER_CONFIG['color_depth']
    
    # Color Management (GOLD STANDARD)
    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look = 'Medium High Contrast'
    scene.view_settings.exposure = 0.8 # Tuned for studio rig (Brighter)
    
    print(f"✓ EEVEE Next Render Configured ({RENDER_CONFIG['samples']} samples, Raytracing ON)")
    
    filenames = []
    
    # CALIBRATION: Support filtering angles
    target_angles = CAMERA_ANGLES
    if args.get('angles'):
        target_names = args['angles'].split(',')
        target_angles = [a for a in CAMERA_ANGLES if a['name'] in target_names]
        print(f"⚠ Calibration mode: rendering only {len(target_angles)} angles")
    
    for angle in target_angles:
        angle_name = angle['name']
        print(f"\nRendering {angle_name}: {angle['desc']}")
        
        # Position camera
        position_camera_for_angle(camera, car_center, angle)
        
        # Render
        output_file = output_path / f"{angle_name}.png"
        scene.render.filepath = str(output_file)
        bpy.ops.render.render(write_still=True)
        
        filenames.append(f"{angle_name}.png")
        print(f"✓ Saved: {output_file}")
    
    # Generate manifest.json
    manifest = {
        'buildId': build_id,
        'year': year,
        'make': make,
        'model': model,
        'trim': trim,
        'paint': paint_name,
        'wheels': wheel_name,
        'angleCount': len(CAMERA_ANGLES),
        'filenames': filenames,
        'renderEngine': 'Blender Cycles',
        'createdAt': bpy.context.scene.frame_current,
    }
    
    manifest_file = output_path / 'manifest.json'
    with open(manifest_file, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"\n✓ Manifest saved: {manifest_file}")
    print(f"✓ All {len(filenames)} angles rendered successfully")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main render pipeline."""
    # Parse command line arguments
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    if len(argv) < 4:
        print("Usage: blender --background --python render_base_models.py -- "
              "--glb <path> --build-id <id> --color <color> --output <dir> "
              "[--year <year>] [--make <make>] [--model <model>] [--trim <trim>]")
        sys.exit(1)
    
    # Parse arguments
    args = {}
    for i in range(0, len(argv), 2):
        key = argv[i].replace('--', '')
        value = argv[i + 1] if i + 1 < len(argv) else None
        args[key] = value
    
    glb_path = args.get('glb')
    build_id = args.get('build-id')
    color_name = args.get('color')
    output_dir = args.get('output')
    year = args.get('year', '')
    make = args.get('make', '')
    model = args.get('model', '')
    trim = args.get('trim', '')
    wheel_name = args.get('wheels', 'Stock')
    
    # Clean scene (preserving nothing except factory globals)
    for obj in bpy.data.objects:
        bpy.data.objects.remove(obj, do_unlink=True)
    for mat in bpy.data.materials:
        bpy.data.materials.remove(mat, do_unlink=True)
    for img in bpy.data.images:
        bpy.data.images.remove(img, do_unlink=True)
    
    # Setup studio (ONCE)
    print("\n[1/5] Setting up studio rig...")
    setup_world_background()
    setup_studio_floor()
    setup_studio_lighting()
    camera_obj, target_empty = setup_camera()
    
    # Import car
    print("\n[2/5] Importing car model...")
    old_objs = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=glb_path)
    imported_objs = [o for o in set(bpy.data.objects) - old_objs]
    
    # Flatten hierarchy
    for obj in imported_objs:
        if obj.type == 'MESH':
            world_mat = obj.matrix_world.copy()
            obj.parent = None
            obj.matrix_world = world_mat
            
    # Cleanup watermarks
    delete_bad_stuff()
    
    # Refresh objects
    car_objs = [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith(("Studio", "Backdrop", "Softbox", "ProductCamera", "OrbitCenter"))]
    
    # 3. GEOMETRIC NORMALIZATION
    print("\n[3/5] Performing Geometric Normalization...")
    
    # Apply all transforms
    bpy.ops.object.select_all(action='DESELECT')
    for o in car_objs: o.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    
    # Orientation Check
    up_vector = detect_orientation(car_objs)
    
    # Create Root
    car_root = bpy.data.objects.new("GLOBAL_CAR_ROOT", None)
    bpy.context.collection.objects.link(car_root)
    for obj in car_objs: obj.parent = car_root
    
    # A. Rotate UP to Z
    if up_vector.x > 0.9: car_root.rotation_euler.y = math.radians(-90)
    elif up_vector.x < -0.9: car_root.rotation_euler.y = math.radians(90)
    elif up_vector.y > 0.9: car_root.rotation_euler.x = math.radians(90)
    elif up_vector.y < -0.9: car_root.rotation_euler.x = math.radians(-90)
    elif up_vector.z < -0.9: car_root.rotation_euler.x = math.radians(180)
    
    bpy.context.view_layer.update()
    
    # B. Flip Check: Ensure car is right-side up
    c, d, mn, mx = get_full_bounding_box(car_objs)
    if is_upside_down_geometry(car_objs, mn.z, mx.z):
        car_root.rotation_euler.x += math.radians(180)
        bpy.context.view_layer.update()

    # C. Direction Check: Ensure car faces Positive Y
    # Find bounding box after potential flip
    c, d, mn, mx = get_full_bounding_box(car_objs)
    
    # MANUAL OVERRIDE
    if args.get('force-rotation'):
        rot = float(args['force-rotation'])
        print(f"  ⚠ MANUAL OVERRIDE: Forcing rotation of {rot} degrees")
        car_root.rotation_euler.z += math.radians(rot)
        bpy.context.view_layer.update()
    
    # Auto-detection
    elif is_facing_backward(car_objs, c.y):
        car_root.rotation_euler.z += math.radians(180)
        bpy.context.view_layer.update()

    # D. Rotate Length to Y
    _, dims, _, _ = get_full_bounding_box(car_objs)
    if dims.x > dims.y:
        car_root.rotation_euler.z += math.radians(90)
        
    bpy.context.view_layer.update()
    
    # C. Ground and Scale to 4.5m
    center, dims, mn, mx = get_full_bounding_box(car_objs)
    current_length = max(dims.x, dims.y)
    scale_factor = 4.5 / current_length
    print(f"  → Normalizing scale ({scale_factor:.2f}x to 4.5m)")
    car_root.scale = (scale_factor, scale_factor, scale_factor)
    bpy.context.view_layer.update()
    
    # Final centering
    c, d, m_n, m_x = get_full_bounding_box(car_objs)
    move_offset = Vector((-c.x, -c.y, -m_n.z))
    car_root.location += move_offset
    bpy.context.view_layer.update()
    
    # Final Verification
    v_center, v_dims, v_min, v_max = get_full_bounding_box(car_objs)
    print(f"✓ Normalization Complete. Length: {max(v_dims.x, v_dims.y):.2f}m, Height: {v_dims.z:.2f}m")
    target_empty.location.z = v_dims.z * 0.4
    
    # Apply paint (DISABLED to preserve original model details/materials)
    print("\n[4/5] Skipping surgical paint override (Keeping original materials)...")
    # apply_paint_override(car_objs, color_name)
    
    # Render all angles
    print("\n[5/5] Rendering all angles...")
    
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_EEVEE'
    scene.eevee.taa_render_samples = RENDER_CONFIG['samples']
    if hasattr(scene.eevee, "use_raytracing"): scene.eevee.use_raytracing = True
    scene.render.resolution_x = RENDER_CONFIG['resolution_x']
    scene.render.resolution_y = RENDER_CONFIG['resolution_y']
    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look = 'Medium High Contrast'
    scene.view_settings.exposure = 0.5
    
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    filenames = []
    target_angles = CAMERA_ANGLES
    if args.get('angles'):
        target_names = args['angles'].split(',')
        target_angles = [a for a in CAMERA_ANGLES if a['name'] in target_names]
        print(f"⚠ Calibration mode: rendering only {len(target_angles)} angles")
    
    for angle in target_angles:
        print(f"\nRendering {angle['name']}: {angle['desc']}")
        position_camera(target_empty, angle, v_dims)
        
        output_file = output_path / f"{angle['name']}.png"
        scene.render.filepath = str(output_file)
        bpy.ops.render.render(write_still=True)
        filenames.append(f"{angle['name']}.png")
        print(f"✓ Saved: {output_file}")
    
    # Manifest
    manifest = {
        'buildId': build_id,
        'year': year, 'make': make, 'model': model, 'trim': trim,
        'paint': color_name, 'wheels': wheel_name,
        'angleCount': len(filenames),
        'filenames': filenames,
        'renderEngine': 'eevee',
        'createdAt': str(datetime.now())
    }
    with open(output_path / 'manifest.json', 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print("\n" + "=" * 80)
    print("RENDER COMPLETE ✓")
    print("=" * 80)


if __name__ == "__main__":
    main()
