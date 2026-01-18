"""
Blender script to add anchor empties to car models for part swapping
Usage: blender --background --python add_anchors.py -- input.glb output.glb
"""

import bpy
import sys
import mathutils

def add_anchors_to_car(input_path, output_path):
    """Add anchor empty objects to car model for part attachment"""
    
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Import GLB
    print(f"Importing {input_path}...")
    bpy.ops.import_scene.gltf(filepath=input_path)
    
    # Find bounding box to auto-position anchors
    all_mesh_objects = [obj for obj in bpy.context.scene.objects if obj.type == 'MESH']
    if not all_mesh_objects:
        print("Error: No mesh objects found!")
        sys.exit(1)
    
    # Calculate car dimensions
    min_x = min(obj.bound_box[0][0] + obj.location.x for obj in all_mesh_objects)
    max_x = max(obj.bound_box[6][0] + obj.location.x for obj in all_mesh_objects)
    min_y = min(obj.bound_box[0][1] + obj.location.y for obj in all_mesh_objects)
    max_y = max(obj.bound_box[6][1] + obj.location.y for obj in all_mesh_objects)
    min_z = min(obj.bound_box[0][2] + obj.location.z for obj in all_mesh_objects)
    max_z = max(obj.bound_box[6][2] + obj.location.z for obj in all_mesh_objects)
    
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    car_length = max_y - min_y
    car_width = max_x - min_x
    car_height = max_z - min_z
    
    print(f"Car dimensions: {car_width:.2f} x {car_length:.2f} x {car_height:.2f}")
    print(f"Center: ({center_x:.2f}, {center_y:.2f})")
    
    # Helper to create anchor empty
    def create_anchor(name, location):
        bpy.ops.object.empty_add(type='PLAIN_AXES', location=location)
        empty = bpy.context.active_object
        empty.name = name
        empty.empty_display_size = 0.1
        print(f"Created anchor: {name} at {location}")
        return empty
    
    # WHEEL ANCHORS (approximate positions based on typical car proportions)
    wheel_offset_x = car_width * 0.35  # 35% from center
    wheel_offset_y_front = car_length * 0.3  # 30% from front
    wheel_offset_y_rear = -car_length * 0.3  # 30% from rear
    wheel_z = min_z + 0.3  # Slightly above ground
    
    create_anchor("ANCHOR_WHEEL_FL", (center_x - wheel_offset_x, center_y + wheel_offset_y_front, wheel_z))
    create_anchor("ANCHOR_WHEEL_FR", (center_x + wheel_offset_x, center_y + wheel_offset_y_front, wheel_z))
    create_anchor("ANCHOR_WHEEL_RL", (center_x - wheel_offset_x, center_y + wheel_offset_y_rear, wheel_z))
    create_anchor("ANCHOR_WHEEL_RR", (center_x + wheel_offset_x, center_y + wheel_offset_y_rear, wheel_z))
    
    # SPOILER ANCHOR (rear deck, top of car)
    spoiler_y = min_y + car_length * 0.15  # 15% from rear
    spoiler_z = max_z - 0.2  # Near roofline
    create_anchor("ANCHOR_SPOILER", (center_x, spoiler_y, spoiler_z))
    
    # EXHAUST ANCHORS (rear bumper, low)
    exhaust_y = min_y - 0.1  # Slightly behind rear
    exhaust_z = min_z + 0.2
    exhaust_offset_x = car_width * 0.2
    create_anchor("ANCHOR_EXHAUST_L", (center_x - exhaust_offset_x, exhaust_y, exhaust_z))
    create_anchor("ANCHOR_EXHAUST_R", (center_x + exhaust_offset_x, exhaust_y, exhaust_z))
    
    # HEADLIGHT ANCHORS (front, upper bumper)
    headlight_y = max_y - 0.1  # Front edge
    headlight_z = min_z + car_height * 0.4
    headlight_offset_x = car_width * 0.3
    create_anchor("ANCHOR_HEADLIGHT_L", (center_x - headlight_offset_x, headlight_y, headlight_z))
    create_anchor("ANCHOR_HEADLIGHT_R", (center_x + headlight_offset_x, headlight_y, headlight_z))
    
    # TAILLIGHT ANCHORS (rear, upper bumper)
    taillight_y = min_y + 0.1  # Rear edge
    taillight_z = min_z + car_height * 0.35
    taillight_offset_x = car_width * 0.3
    create_anchor("ANCHOR_TAILLIGHT_L", (center_x - taillight_offset_x, taillight_y, taillight_z))
    create_anchor("ANCHOR_TAILLIGHT_R", (center_x + taillight_offset_x, taillight_y, taillight_z))
    
    # BUMPER ANCHORS
    create_anchor("ANCHOR_FRONT_BUMPER", (center_x, max_y, min_z + car_height * 0.25))
    create_anchor("ANCHOR_REAR_BUMPER", (center_x, min_y, min_z + car_height * 0.25))
    
    # DIFFUSER ANCHOR (rear, bottom)
    create_anchor("ANCHOR_DIFFUSER", (center_x, min_y, min_z + 0.15))
    
    # SIDE SKIRT ANCHORS (mid-car, low)
    skirt_y = center_y
    skirt_z = min_z + 0.2
    skirt_offset_x = (max_x - min_x) / 2 + 0.05
    create_anchor("ANCHOR_SIDE_SKIRT_L", (center_x - skirt_offset_x, skirt_y, skirt_z))
    create_anchor("ANCHOR_SIDE_SKIRT_R", (center_x + skirt_offset_x, skirt_y, skirt_z))
    
    print(f"✅ Added {len([obj for obj in bpy.context.scene.objects if obj.type == 'EMPTY'])} anchor empties")
    
    # Export GLB with anchors
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
    
    print(f"✅ Export complete with anchors embedded!")


if __name__ == "__main__":
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    if len(argv) < 2:
        print("Usage: blender --background --python add_anchors.py -- input.glb output.glb")
        sys.exit(1)
    
    input_path = argv[0]
    output_path = argv[1]
    
    add_anchors_to_car(input_path, output_path)
