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
    """Dark gradient studio background matching PDF style."""
    world = bpy.context.scene.world
    if not world.node_tree:
        world.use_nodes = True
    
    nodes = world.node_tree.nodes
    links = world.node_tree.links
    nodes.clear()
    
    tex_coord = nodes.new('ShaderNodeTexCoord')
    separate_xyz = nodes.new('ShaderNodeSeparateXYZ')
    color_ramp = nodes.new('ShaderNodeValToRGB')
    background = nodes.new('ShaderNodeBackground')
    output = nodes.new('ShaderNodeOutputWorld')
    
    # Dark gradient configuration - MATCHES PDF REFERENCE
    # PDF shows light-to-medium grey studio, NOT near-black
    # GEMINI PREMIUM: Dark gradient (darkest edges, lighter center)
    color_ramp.color_ramp.elements[0].position = 0.0
    color_ramp.color_ramp.elements[0].color = (0.12, 0.12, 0.14, 1.0)  # Very dark edges
    color_ramp.color_ramp.elements[1].position = 0.5
    color_ramp.color_ramp.elements[1].color = (0.20, 0.20, 0.23, 1.0)  # Slightly lighter center
    
    color_ramp.color_ramp.elements.new(1.0)
    color_ramp.color_ramp.elements[2].color = (0.15, 0.15, 0.18, 1.0)  # Dark top
    
    background.inputs['Strength'].default_value = 0.75  # Subtle
    
    links.new(tex_coord.outputs['Window'], separate_xyz.inputs['Vector'])
    links.new(separate_xyz.outputs['Z'], color_ramp.inputs['Fac'])
    links.new(color_ramp.outputs['Color'], background.inputs['Color'])
    links.new(background.outputs['Background'], output.inputs['Surface'])
    
    print("✓ Gemini premium dark gradient background")


def setup_studio_floor():
    """Studio floor with subtle reflection."""
    bpy.ops.mesh.primitive_plane_add(size=100, location=(0, 0, 0))
    floor = bpy.context.active_object
    floor.name = "StudioFloor"
    
    mat = bpy.data.materials.new(name="FloorMaterial")
    if not mat.node_tree:
        mat.use_nodes = True
    
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    output = nodes.new('ShaderNodeOutputMaterial')
    
    # GEMINI PREMIUM: Subtle reflection floor (not mirror, not matte)
    bsdf.inputs['Base Color'].default_value = (0.15, 0.15, 0.17, 1.0)  # Dark floor
    bsdf.inputs['Metallic'].default_value = 0.0
    bsdf.inputs['Roughness'].default_value = 0.55  # Controlled reflection
    bsdf.inputs['Specular IOR Level'].default_value = 0.35  # Subtle
    
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    floor.data.materials.append(mat)
    
    print("✓ Gemini premium floor (subtle reflection)")
    return floor


def setup_studio_lighting():
    """Professional 3-light softbox setup (LOCKED positions)."""
    if 'Light' in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects['Light'], do_unlink=True)
    
    lights = []
    
    # GEMINI PREMIUM: Key light (main, warm softbox)
    key_light = bpy.data.lights.new(name="KeyLight", type='AREA')
    key_light.energy = 450  # Stronger
    key_light.size = 6.5  # Larger softbox
    key_light.color = (1.0, 0.98, 0.95)  # Slightly warm
    key_obj = bpy.data.objects.new(name="KeyLight", object_data=key_light)
    bpy.context.collection.objects.link(key_obj)
    key_obj.location = (6, -7, 4.5)
    key_obj.rotation_euler = (math.radians(50), 0, math.radians(-35))
    lights.append(key_obj)
    
    # GEMINI PREMIUM: Fill light (cool, weaker)
    fill_light = bpy.data.lights.new(name="FillLight", type='AREA')
    fill_light.energy = 180
    fill_light.size = 5.0
    fill_light.color = (0.95, 0.95, 1.0)  # Slightly cool
    fill_obj = bpy.data.objects.new(name="FillLight", object_data=fill_light)
    bpy.context.collection.objects.link(fill_obj)
    fill_obj.location = (-5, -6, 3)
    fill_obj.rotation_euler = (math.radians(45), 0, math.radians(30))
    lights.append(fill_obj)
    
    # GEMINI PREMIUM: Rim light (CRITICAL for separation from BG)
    rim_light = bpy.data.lights.new(name="RimLight", type='SPOT')
    rim_light.energy = 700  # Much stronger
    rim_light.spot_size = math.radians(55)
    rim_light.spot_blend = 0.25
    rim_obj = bpy.data.objects.new(name="RimLight", object_data=rim_light)
    bpy.context.collection.objects.link(rim_obj)
    rim_obj.location = (0, 8, 6.5)
    rim_obj.rotation_euler = (math.radians(-48), 0, 0)
    lights.append(rim_obj)
    
    print(f"✓ Gemini premium 3-point studio lighting ({len(lights)} lights)")
    return lights


def setup_camera(lens=85):
    """Create camera with product photography settings."""
    if 'Camera' in bpy.data.objects:
        bpy.data.objects.remove(bpy.data.objects['Camera'], do_unlink=True)
    
    camera_data = bpy.data.cameras.new(name='ProductCamera')
    camera_data.lens = lens
    camera_data.sensor_width = 36
    camera_data.clip_start = 0.1
    camera_data.clip_end = 1000
    
    camera_obj = bpy.data.objects.new('ProductCamera', camera_data)
    bpy.context.collection.objects.link(camera_obj)
    bpy.context.scene.camera = camera_obj
    
    print(f"✓ Camera created (lens: {lens}mm)")
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
    """Override paint material on body panels."""
    paint_mat = bpy.data.materials.new(name=f"Paint_{paint_spec['name']}")
    if not paint_mat.node_tree:
        paint_mat.use_nodes = True
    
    nodes = paint_mat.node_tree.nodes
    links = paint_mat.node_tree.links
    nodes.clear()
    
    bsdf = nodes.new('ShaderNodeBsdfPrincipled')
    output = nodes.new('ShaderNodeOutputMaterial')
    
    bsdf.inputs['Base Color'].default_value = tuple(paint_spec['baseColor'])
    bsdf.inputs['Metallic'].default_value = paint_spec['metallic']
    bsdf.inputs['Roughness'].default_value = paint_spec['roughness']
    
    # Fix for Blender 5.0 - Clearcoat renamed
    if 'Coat Weight' in bsdf.inputs:
        bsdf.inputs['Coat Weight'].default_value = paint_spec['clearcoat']
    elif 'Clearcoat' in bsdf.inputs:
        bsdf.inputs['Clearcoat'].default_value = paint_spec['clearcoat']
    
    links.new(bsdf.outputs['BSDF'], output.inputs['Surface'])
    
    paint_keywords = ['paint', 'body', 'car', 'exterior', 'panel']
    replaced_count = 0
    
    for obj in car_objects:
        if obj.type != 'MESH':
            continue
        
        for slot in obj.material_slots:
            if slot.material:
                mat_name_lower = slot.material.name.lower()
                if any(keyword in mat_name_lower for keyword in paint_keywords):
                    slot.material = paint_mat
                    replaced_count += 1
    
    print(f"✓ Paint override applied: {paint_spec['name']} ({replaced_count} materials)")


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
    output_path = Path(spec['outputDir'])
    output_path.mkdir(parents=True, exist_ok=True)
    
    camera = bpy.context.scene.camera
    scene = bpy.context.scene
    
    # Calculate optimal camera distance based on car size
    camera_distance = calculate_optimal_camera_distance(car_dimensions, spec['camera']['lens'])
    
    # BRZ QUALITY - Cycles 128 samples (render_studio.py line 70)
    render_settings = spec['renderSettings']
    scene.render.resolution_x = render_settings['resolutionX']
    scene.render.resolution_y = render_settings['resolutionY']
    
    # Use CYCLES with BRZ's exact settings
    scene.render.engine = 'CYCLES'
    scene.cycles.samples = 128  # BRZ quality (render_studio.py)
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = 'OPENIMAGEDENOISE'
    
    # Enable GPU acceleration
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
        prefs.compute_device_type = 'METAL'
        scene.cycles.device = 'GPU'
        print("  ✓ Render: Cycles 128 samples + GPU (BRZ quality)")
    except:
        scene.cycles.device = 'CPU'
        print("  ✓ Render: Cycles 128 samples CPU")
    
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.render.image_settings.color_depth = '16'
    
    # Color management (LOCKED exposure)
    scene.view_settings.view_transform = 'Filmic'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0.0
    
    filenames = []
    
    for angle in CAMERA_ANGLES:
        angle_name = angle['name']
        print(f"\nRendering {angle_name}: {angle['desc']}")
        
        position_camera_for_angle(camera, car_center, angle, camera_distance)
        
        output_file = output_path / f"{angle_name}.png"
        scene.render.filepath = str(output_file)
        bpy.ops.render.render(write_still=True)
        
        filenames.append(f"{angle_name}.png")
        print(f"✓ Saved: {output_file}")
    
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
