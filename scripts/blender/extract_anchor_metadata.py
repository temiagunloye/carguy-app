"""
Blender script to extract anchor positions from GLB and output JSON metadata
Usage: blender --background --python extract_anchor_metadata.py -- input.glb output.json
"""

import bpy
import sys
import json
import os

def extract_anchors_from_glb(input_path, output_json):
    """Extract all ANCHOR_* empties from GLB and save as JSON"""
    
    # Clear scene
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    
    # Import GLB
    print(f"Importing {input_path}...")
    bpy.ops.import_scene.gltf(filepath=input_path)
    
    # Find all empties with ANCHOR_ prefix
    anchors = {}
    anchor_count = 0
    
    for obj in bpy.context.scene.objects:
        if obj.type == 'EMPTY' and obj.name.startswith('ANCHOR_'):
            anchor_name = obj.name
            location = obj.location
            anchors[anchor_name] = {
                'x': round(location.x, 4),
                'y': round(location.y, 4),
                'z': round(location.z, 4)
            }
            anchor_count += 1
            print(f"  Found: {anchor_name} at ({location.x:.4f}, {location.y:.4f}, {location.z:.4f})")
    
    if anchor_count == 0:
        print("⚠️  No ANCHOR_* empties found in GLB!")
        # Return empty but valid structure
        output_data = {
            'anchorPoints': {},
            'anchorsVersion': 'v1',
            'anchorCount': 0
        }
    else:
        output_data = {
            'anchorPoints': anchors,
            'anchorsVersion': 'v1',
            'anchorCount': anchor_count
        }
    
    # Write JSON
    with open(output_json, 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\n✅ Extracted {anchor_count} anchors to {output_json}")
    return anchor_count

if __name__ == "__main__":
    argv = sys.argv
    argv = argv[argv.index("--") + 1:] if "--" in argv else []
    
    if len(argv) < 2:
        print("Usage: blender --background --python extract_anchor_metadata.py -- input.glb output.json")
        sys.exit(1)
    
    input_path = argv[0]
    output_json = argv[1]
    
    if not os.path.exists(input_path):
        print(f"Error: Input file not found: {input_path}")
        sys.exit(1)
    
    extract_anchors_from_glb(input_path, output_json)
