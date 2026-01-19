
import bpy
import os
import math

# Output directory
output_dir = os.path.join(os.getcwd(), "tmp", "parts")
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()

def export_glb(filename):
    filepath = os.path.join(output_dir, filename)
    bpy.ops.export_scene.gltf(filepath=filepath, export_format='GLB')
    print(f"Exported: {filepath}")

# 1. Wheel (Cylinder) - 500mm diam, 200mm width
def create_wheel():
    clear_scene()
    # Blender units are meters. 500mm = 0.5m
    bpy.ops.mesh.primitive_cylinder_add(
        radius=0.25, 
        depth=0.2, 
        location=(0, 0, 0),
        rotation=(0, math.radians(90), 0) # Rotate to face X axis (typical for wheel instancing)
    )
    obj = bpy.context.active_object
    obj.name = "DemoWheel"
    export_glb("wheel_aftermarket_01.glb")

# 2. Front Lip (Cube) - 1.8m wide, 0.1m high, 0.3m deep
def create_lip():
    clear_scene()
    bpy.ops.mesh.primitive_cube_add(
        size=1, 
        location=(0, 0, 0)
    )
    obj = bpy.context.active_object
    obj.name = "DemoLip"
    # Scale to dimensions (X=width, Y=height, Z=depth - depending on viewer axes)
    # Assuming Y is up, Z is forward/back in Viewer (typical Three.js)
    # But Blender Z is up. Let's align with typical car coordinates.
    # Car width usually X, Length Z, Height Y.
    obj.dimensions = (1.8, 0.1, 0.5) 
    export_glb("front_lip_01.glb")

# 3. Side Skirt (Cube) - 2.6m long, 0.1m high, 0.15m deep
def create_skirt():
    clear_scene()
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0))
    obj = bpy.context.active_object
    obj.name = "DemoSkirt"
    # Length on Z axis (along car), Width/Depth on X, Height on Y
    obj.dimensions = (0.15, 0.1, 2.6)
    export_glb("side_skirt_01.glb")

# 4. Rear Diffuser (Cube) - 1.8m wide, 0.2m high, 0.4m deep
def create_diffuser():
    clear_scene()
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,0))
    obj = bpy.context.active_object
    obj.name = "DemoDiffuser"
    obj.dimensions = (1.8, 0.2, 0.4)
    export_glb("rear_diffuser_01.glb")

# Run all
create_wheel()
create_lip()
create_skirt()
create_diffuser()
