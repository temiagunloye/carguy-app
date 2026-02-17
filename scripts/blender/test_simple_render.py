import bpy
import os

print("DEBUG: Simple render test starting...")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.mesh.primitive_cube_add()
camera_data = bpy.data.cameras.new(name='Cam')
camera_obj = bpy.data.objects.new('Cam', camera_data)
bpy.context.collection.objects.link(camera_obj)
bpy.context.scene.camera = camera_obj
camera_obj.location = (5, -5, 5)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
try:
    prefs = bpy.context.preferences.addons['cycles'].preferences
    prefs.compute_device_type = 'NONE'
except:
    pass

scene.render.filepath = "test_cube.png"

print("DEBUG: Calling render...")
bpy.ops.render.render(write_still=True)
print("DEBUG: Render complete!")
