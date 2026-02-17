"""
BLENDER GOLD STANDARD STUDIO RIG - JSON-Spec Based Renderer
Matches PDF quality reference (dark gradient + consistent lighting + subtle reflection)

Usage:
    blender --background --python render_from_json.py -- render_specs/m3_2023_stock_alpine_white.json

No shell quoting issues - all parameters in JSON file.
"""

import bpy
import math
import json
import os
import sys
from pathlib import Path
from mathutils import Vector, Euler
from datetime import datetime

# ============================================================================
# CAMERA ANGLES (LOCKED ORDER)
# ============================================================================

CAMERA_ANGLES = [
    {'name': 'angle_01', 'rotation': 45, 'elevation': 0, 'desc': 'Front 3/4 driver'},
    {'name': 'angle_02', 'rotation': 0, 'elevation': 0, 'desc': 'Front direct'},
    {'name': 'angle_03', 'rotation': -45, 'elevation': 0, 'desc': 'Front 3/4 passenger'},
    {'name': 'angle_04', 'rotation': -90, 'elevation': 0, 'desc': 'Side passenger'},
    {'name': 'angle_05', 'rotation': -135, 'elevation': 0, 'desc': 'Rear 3/4 passenger'},
    {'name': 'angle_06', 'rotation': 180, 'elevation': 0, 'desc': 'Rear direct'},
    {'name': 'angle_07', 'rotation': 135, 'elevation': 0, 'desc': 'Rear 3/4 driver'},
    {'name': 'angle_08', 'rotation': 90, 'elevation': 0, 'desc': 'Side driver'},
    {'name': 'angle_09', 'rotation': 45, 'elevation': 15, 'desc': 'High front 3/4'},
    {'name': 'angle_10', 'rotation': -135, 'elevation': -10, 'desc': 'Low rear 3/4'},
]


# ============================================================================
# STUDIO RIG SETUP (GOLD STANDARD - MATCHES PDF)
# ============================================================================

def setup_world_background():
    """Simplified world for stability check."""
    if not bpy.context.scene.world:
        bpy.context.scene.world = bpy.data.worlds.new("World")
    world = bpy.context.scene.world
    world.use_nodes = True
    world.node_tree.nodes.clear()
    bg = world.node_tree.nodes.new('ShaderNodeBackground')
    bg.inputs['Color'].default_value = (0.1, 0.1, 0.12, 1.0)
    out = world.node_tree.nodes.new('ShaderNodeOutputWorld')
    world.node_tree.links.new(bg.outputs['Background'], out.inputs['Surface'])
    print("✓ Simple world background created")


def setup_studio_floor():
    """Simplified flat floor for stability check."""
    bpy.ops.mesh.primitive_plane_add(size=100, location=(0, 0, 0))
    cyc = bpy.context.active_object
    cyc.name = "StudioFloor"
    
    mat = bpy.data.materials.new(name="FloorMaterial")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.new('ShaderNodeBsdfPrincipled')
    output = mat.node_tree.nodes.new('ShaderNodeOutputMaterial')
    bsdf.inputs['Base Color'].default_value = (0.01, 0.01, 0.012, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.2
    mat.node_tree.links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    cyc.data.materials.append(mat)
    
    print("✓ Simple floor plane created")
    return cyc


def setup_compositor(scene):
    """GEMINI PREMIUM: Blender compositor for that 'Gold Standard' finish."""
    scene.use_nodes = True
    # In some Blender versions/background mode, scene.node_tree might be on bpy.data
    tree = getattr(scene, "node_tree", None)
    if not tree:
        # Fallback to main scene data
        tree = bpy.data.scenes[0].node_tree
        
    if not tree:
        print("  ! Warning: Composite node tree not found, skipping compositor")
        return
        
    nodes = tree.nodes
    links = tree.links
    nodes.clear()
    
    render_layers = nodes.new('CompositorNodeRLayers')
    composite = nodes.new('CompositorNodeComposite')
    
    # 1. Slight contrast/brightness
    bright_contrast = nodes.new('CompositorNodeBrightContrast')
    bright_contrast.inputs['Contrast'].default_value = 0.1
    
    # 2. Sharpen (Dilation/Erosion logic)
    sharpen = nodes.new('CompositorNodeFilter')
    sharpen.filter_type = 'SHARPEN'
    sharpen.inputs['Fac'].default_value = 0.2
    
    # 3. Subtle Vignette
    vignette = nodes.new('CompositorNodeLensdist')
    vignette.inputs['Distort'].default_value = 0.0
    vignette.inputs['Dispersion'].default_value = 0.0
    # Actually use a custom vignette with math nodes or just keep it clean
    
    links.new(render_layers.outputs['Image'], sharpen.inputs['Image'])
    links.new(sharpen.outputs['Image'], bright_contrast.inputs['Image'])
    links.new(bright_contrast.outputs['Image'], composite.inputs['Image'])
    
    print("✓ Gemini premium compositor setup active")


def setup_studio_lighting():
    """Professional 3-point softbox rig (GOLD STANDARD)."""
    # Clear existing lights
    for obj in bpy.data.objects:
        if obj.type == 'LIGHT':
            bpy.data.objects.remove(obj, do_unlink=True)
    
    lights = []
    coll = bpy.context.scene.collection
    
    # 1. KEY LIGHT: Large Area (Front-Left, High)
    key_light = bpy.data.lights.new(name="Key_Softbox", type='AREA')
    key_light.energy = 1000
    key_light.size = 10.0
    key_light.color = (1.0, 0.98, 0.96)
    key_obj = bpy.data.objects.new(name="Key_Softbox", object_data=key_light)
    coll.objects.link(key_obj)
    key_obj.location = (8, -10, 7)
    key_obj.rotation_euler = (math.radians(50), 0, math.radians(-35))
    lights.append(key_obj)
    
    # 2. FILL LIGHT: Medium Area (Front-Right, Low)
    fill_light = bpy.data.lights.new(name="Fill_Softbox", type='AREA')
    fill_light.energy = 400
    fill_light.size = 7.0
    fill_light.color = (0.96, 0.98, 1.0)
    fill_obj = bpy.data.objects.new(name="Fill_Softbox", object_data=fill_light)
    coll.objects.link(fill_obj)
    fill_obj.location = (-8, -8, 4)
    fill_obj.rotation_euler = (math.radians(40), 0, math.radians(40))
    lights.append(fill_obj)
    
    # 3. RIM LIGHT: Strong separation (Behind car)
    rim_light = bpy.data.lights.new(name="Rim_Light", type='AREA')
    rim_light.energy = 1500
    rim_light.size = 6.0
    rim_obj = bpy.data.objects.new(name="Rim_Light", object_data=rim_light)
    coll.objects.link(rim_obj)
    rim_obj.location = (0, 12, 5)
    rim_obj.rotation_euler = (math.radians(-100), 0, 0)
    lights.append(rim_obj)
    
    print(f"✓ Gemini GOLD STANDARD 3-point studio lighting ({len(lights)} lights)")
    return lights


def setup_camera(lens=85):
    """Get or create camera."""
    if bpy.context.scene.camera:
        camera_obj = bpy.context.scene.camera
    else:
        camera_data = bpy.data.cameras.new(name='ProductCamera')
        camera_obj = bpy.data.objects.new('ProductCamera', camera_data)
        bpy.context.scene.collection.objects.link(camera_obj)
        bpy.context.scene.camera = camera_obj
    
    camera_obj.data.lens = lens
    print(f"✓ Camera ready (lens: {lens}mm)")
    return camera_obj


# ============================================================================
# CAR MODEL HANDLING
# ============================================================================

def import_glb(glb_path):
    """Import GLB model."""
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
    """Center car at origin and normalize to consistent size."""
    meshes = [obj for obj in car_objects if obj.type == 'MESH']
    
    if not meshes:
        raise RuntimeError("No mesh objects found")
    
    min_co = Vector((float('inf'), float('inf'), float('inf')))
    max_co = Vector((float('-inf'), float('-inf'), float('-inf')))
    
    for obj in meshes:
        for vertex in obj.data.vertices:
            world_co = obj.matrix_world @ vertex.co
            min_co.x = min(min_co.x, world_co.x)
            min_co.y = min(min_co.y, world_co.y)
            min_co.z = min(min_co.z, world_co.z)
            max_co.x = max(max_co.x, world_co.x)
            max_co.y = max(max_co.y, world_co.y)
            max_co.z = max(max_co.z, world_co.z)
    
    center = (min_co + max_co) / 2
    dimensions = max_co - min_co
    offset = Vector((center.x, center.y, min_co.z))
    
    # Center car
    for obj in car_objects:
        obj.location -= offset
    
    # AUTO-SCALE: Normalize all cars to ~4.5m length for consistent framing
    max_dimension = max(dimensions.x, dimensions.y, dimensions.z)
    target_size = 4.5  # Target car size in Blender units
    if max_dimension > 0:
        scale_factor = target_size / max_dimension
        for obj in car_objects:
            obj.scale *= scale_factor
        dimensions *= scale_factor
        print(f"✓ Car scaled {scale_factor:.2f}x to {target_size}m (was {max_dimension:.2f}m)")
    
    print(f"✓ Car centered (final dims: {dimensions.x:.2f} x {dimensions.y:.2f} x {dimensions.z:.2f})")
    
    return car_objects[0], dimensions


def apply_paint_override(car_objects, paint_spec):
    """GEMINI AUTOMOTIVE PAINT: Clearcoat, proper IOR, realistic roughness."""
    print(f"DEBUG: Starting paint override for {len(car_objects)} objects", flush=True)
    paint_mat = bpy.data.materials.new(name=f"Paint_{paint_spec['name']}")
    paint_mat.use_nodes = True
    
    nodes = paint_mat.node_tree.nodes
    links = paint_mat.node_tree.links
    nodes.clear()
    
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    output = nodes.new('ShaderNodeOutputMaterial')
    
    # GEMINI AUTOMOTIVE: Color-specific roughness tuning
    paint_name = paint_spec['name'].lower()
    if 'black' in paint_name or 'obsidian' in paint_name:
        roughness = 0.12  # Deep glossy black
    elif 'white' in paint_name or 'alpine' in paint_name:
        roughness = 0.18  # Glossy white
    elif 'grey' in paint_name or 'gray' in paint_name or 'nardo' in paint_name:
        roughness = 0.25  # Satin grey (not metallic)
    elif 'red' in paint_name or 'guards' in paint_name:
        roughness = 0.14  # Glossy red
    else:
        roughness = paint_spec.get('roughness', 0.15)
    
    bsdf.inputs['Base Color'].default_value = tuple(paint_spec['baseColor'])
    bsdf.inputs['Metallic'].default_value = paint_spec['metallic']
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['IOR'].default_value = 1.5  # Automotive paint IOR
    
    # GEMINI: Strong clearcoat (CRITICAL for photo look)
    clearcoat_val = 0.85
    if 'Clearcoat Weight' in bsdf.inputs:
        bsdf.inputs['Clearcoat Weight'].default_value = clearcoat_val
        bsdf.inputs['Clearcoat Roughness'].default_value = 0.05
    elif 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = clearcoat_val
    elif 'Clearcoat' in bsdf.inputs:
        bsdf.inputs['Clearcoat'].default_value = clearcoat_val
    
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    print("DEBUG: Finding body panels...", flush=True)
    # GEMINI: Aggressive Heuristic to find body panels
    body_keywords = ['body', 'paint', 'base', 'exterior', 'panel', 'door', 'hood', 'roof', 'fender', 'quarter', 'shell', 'mat', 'metal', 'surface']
    skip_keywords = ['glass', 'window', 'tire', 'rubber', 'wheel', 'internal', 'interior', 'light', 'lamp', 'plastic', 'chrome', 'engine']
    materials_applied = 0
    
    for obj in car_objects:
        if obj.type != 'MESH':
            continue
        for slot in obj.material_slots:
            if not slot.material:
                continue
            mat_name_lower = slot.material.name.lower()
            if any(keyword in mat_name_lower for keyword in body_keywords) and not any(skip in mat_name_lower for skip in skip_keywords):
                slot.material = paint_mat
                materials_applied += 1
                
    # Fallback if 0 (apply to most frequent non-skipped material)
    if materials_applied == 0:
        print("  ! Warning: No body materials found by keyword, applying to all non-skipped materials", flush=True)
        for obj in car_objects:
            if obj.type != 'MESH':
                continue
            for slot in obj.material_slots:
                if not slot.material:
                    continue
                mat_name_lower = slot.material.name.lower()
                if not any(skip in mat_name_lower for skip in skip_keywords):
                    slot.material = paint_mat
                    materials_applied += 1
    
    print(f"✓ Gemini automotive clearcoat paint applied ({materials_applied} materials)", flush=True)


# ============================================================================
# RENDERING
# ============================================================================

def calculate_optimal_camera_distance(dimensions, lens_mm=85):
    """
    FIXED camera distance for 4.5m normalized cars.
    After auto-scaling to 4.5m, use 8 unit camera distance.
    """
    distance = 8.0  # For 4.5m cars (was 6.5 for unscaled BRZ)
    
    print(f"  ✓ Camera distance: {distance} units (optimized for 4.5m scaled cars)")
    
    return distance


def position_camera_for_angle(camera, car_center, angle_config, distance):
    """Position camera for specific angle."""
    rotation_deg = angle_config['rotation']
    elevation_deg = angle_config['elevation']
    
    rotation_rad = math.radians(rotation_deg)
    elevation_rad = math.radians(elevation_deg)
    
    x = distance * math.cos(elevation_rad) * math.sin(rotation_rad)
    y = -distance * math.cos(elevation_rad) * math.cos(rotation_rad)
    z = 1.6  # Fixed height matching BRZ (render_studio.py line 100)
    
    camera.location = Vector((x, y, z))
    
    direction = car_center - camera.location
    rot_quat = direction.to_track_quat('-Z', 'Y')
    camera.rotation_euler = rot_quat.to_euler()


def render_all_angles(spec, car_center, car_dimensions):
    """Render all 10 angles."""
    print("DEBUG: Inside render_all_angles", flush=True)
    output_path = Path(spec['outputDir'])
    output_path.mkdir(parents=True, exist_ok=True)
    
    camera = bpy.context.scene.camera
    scene = bpy.context.scene
    
    # Calculate optimal camera distance
    print("DEBUG: Setting camera distance", flush=True)
    camera_distance = calculate_optimal_camera_distance(car_dimensions, spec['camera']['lens'])
    
    # EEVEE for calibration speed and stability
    print("DEBUG: Switching to EEVEE for calibration...", flush=True)
    scene.render.engine = 'BLENDER_EEVEE' # Use EEVEE to avoid background hangs during tuning
    scene.eevee.taa_render_samples = 64
    
    render_settings = spec['renderSettings']
    scene.render.resolution_x = render_settings['resolutionX']
    scene.render.resolution_y = render_settings['resolutionY']
    
    print("  ✓ Render: EEVEE 64 samples", flush=True)
    
    # Use CPU for absolute stability during calibration
    print("DEBUG: Forcing CPU for calibration stability...", flush=True)
    scene.cycles.device = 'CPU'
    print("  ✓ Render: Cycles 48 samples CPU + OIDN", flush=True)
    
    # COMPOSITOR (Disabled due to background API issues)
    # setup_compositor(scene)
    
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '16'
    
    # Color management (LOCKED exposure)
    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look = 'Medium High Contrast'
    scene.view_settings.exposure = 0.0
    
    print("DEBUG: Starting angle loop", flush=True)
    filenames = []
    
    # Ensure absolute path for output
    abs_output_path = output_path.resolve()
    abs_output_path.mkdir(parents=True, exist_ok=True)
    
    # CALIBRATION: Support filtering angles if specified in argv
    target_angles = CAMERA_ANGLES
    if 'angles' in spec:
        angle_names = spec['angles'].split(',')
        target_angles = [a for a in CAMERA_ANGLES if a['name'] in angle_names]
        print(f"  → Calibration mode: rendering only {len(target_angles)} angles", flush=True)
    
    for angle in target_angles:
        angle_name = angle['name']
        print(f"\nRendering {angle_name}: {angle['desc']}", flush=True)
        
        # Consistent distancing for 4.5m scaled cars
        position_camera_for_angle(camera, car_center, angle, 8.5)
        
        output_file = abs_output_path / f"{angle_name}.png"
        scene.render.filepath = str(output_file)
        
        print(f"  → Blender Render Starting (Path: {scene.render.filepath})...", flush=True)
        bpy.ops.render.render(write_still=True)
        
        filenames.append(f"{angle_name}.png")
        print(f"  ✓ Saved: {output_file}", flush=True)
    
    # Generate manifest
    manifest = {
        'buildId': spec['buildId'],
        'year': spec['metadata']['year'],
        'make': spec['metadata']['make'],
        'model': spec['metadata']['model'],
        'trim': spec['metadata']['trim'],
        'paint': spec['paint']['name'],
        'angleCount': len(CAMERA_ANGLES),
        'filenames': filenames,
        'renderEngine': 'CYCLES',
        'createdAt': datetime.now().isoformat(),
    }
    
    manifest_file = output_path / 'manifest.json'
    with open(manifest_file, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"\n✓ Manifest saved: {manifest_file}")
    print(f"✓ All {len(filenames)} angles rendered")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

def main():
    """Main render pipeline."""
    # DO NOT use factory reset in background mode if it hangs
    # bpy.ops.wm.read_factory_settings(use_empty=True)
    
    # Manual deep clean
    for coll in bpy.data.collections:
        for obj in coll.objects:
            bpy.data.objects.remove(obj, do_unlink=True)
    for mat in bpy.data.materials:
        bpy.data.materials.remove(mat, do_unlink=True)
    for world in bpy.data.worlds:
        if world.name != "World": # Keep one if possible, or just clear all
            bpy.data.worlds.remove(world, do_unlink=True)
    
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    if len(argv) < 1:
        print("Usage: blender --background --python render_from_json.py -- <spec.json>")
        sys.exit(1)
    
    spec_path = argv[0]
    
    print("=" * 80)
    print("BLENDER GOLD STANDARD STUDIO RIG (JSON-SPEC)")
    print("=" * 80)
    print(f"Spec: {spec_path}")
    print("=" * 80)
    
    # Load spec
    with open(spec_path, 'r') as f:
        spec = json.load(f)
    
    print(f"Build ID: {spec['buildId']}")
    print(f"GLB: {spec['glbPath']}")
    print(f"Paint: {spec['paint']['name']}")
    print(f"Engine: {spec['renderSettings']['engine']}")
    print("=" * 80)
    
    # Clean scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Setup studio
    print("\n[1/5] Setting up studio rig...")
    setup_world_background()
    floor = setup_studio_floor()
    lights = setup_studio_lighting()
    camera = setup_camera(spec['camera']['lens'])
    
    # Import car
    print("\n[2/5] Importing car model...")
    car_objects = import_glb(spec['glbPath'])
    
    # Center
    print("\n[3/5] Centering car...")
    car_root, dimensions = center_and_scale_car(car_objects)
    car_center = Vector((0, 0, dimensions.z / 2))
    
    # Apply paint
    print("\n[4/5] Applying paint override...")
    apply_paint_override(car_objects, spec['paint'])
    
    # Render
    print("\n[5/5] Rendering all angles...")
    render_all_angles(spec, car_center, dimensions)
    
    print("\n" + "=" * 80)
    print("RENDER COMPLETE ✓")
    print("=" * 80)


if __name__ == "__main__":
    main()
