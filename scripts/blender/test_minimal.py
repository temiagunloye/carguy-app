import bpy
import os

print("DEBUG: Minimal render test (no factory reset)...")
# Delete all objects manually
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

bpy.ops.mesh.primitive_cube_add()
camera_data = bpy.data.cameras.new(name='Cam')
camera_obj = bpy.data.objects.new('Cam', camera_data)
bpy.context.collection.objects.link(camera_obj)
bpy.context.scene.camera = camera_obj
camera_obj.location = (5, -5, 5)

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 1
scene.render.filepath = os.path.abspath("test_cube_final.png")

print("DEBUG: Calling render...")
bpy.ops.render.render(write_still=True)
print("DEBUG: Final render complete!")
