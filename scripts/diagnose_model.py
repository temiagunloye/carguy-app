import bpy
import sys

glb_path = "source_models/base_glb/bmw_m3.glb"
bpy.ops.import_scene.gltf(filepath=glb_path)

print("\n--- OBJECTS ---")
for obj in bpy.data.objects:
    if obj.type == 'MESH':
        print(f"OBJ: {obj.name}")

print("\n--- MATERIALS ---")
for mat in bpy.data.materials:
    print(f"MAT: {mat.name}")
