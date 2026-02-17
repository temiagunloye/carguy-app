import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage
from pathlib import Path

# Initialize Firebase if not already
try:
    app = firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'carguy-app-demo.firebasestorage.app'
    })

db = firestore.client()
bucket = storage.bucket()

GLB_MAP = {
    "m3_2023_stock_alpine_white": "bmw_m3.glb",
    "rs6_2024_stock_nardo_grey": "audi_rs6_2020.glb",
    "gt3_stock_guards_red": "porsche_gt3_2022.glb",
    "c63_2024_stock_obsidian_black": "mercedes_c63_2019.glb"
}

def upload_glb(local_path, destination_blob_name):
    print(f"Uploading {local_path} to {destination_blob_name}...")
    blob = bucket.blob(destination_blob_name)
    blob.upload_from_filename(local_path)
    blob.make_public()
    return blob.public_url

def sync_all_glbs():
    for build_id, glb_name in GLB_MAP.items():
        # Source GLBs are in source_models/base_glb/ or user provided paths
        # Given inputs: /mnt/data/... in prompt, but locally they are in source_models/base_glb/
        local_path = f"source_models/base_glb/{glb_name}"
        if not os.path.exists(local_path):
            # Try the filename used in the json specs
            # M3 is bmw_m3.glb, C63 is mercedes_c63_2019.glb, etc.
            # I will just check what's actually there
            print(f"File not found: {local_path}")
            continue
            
        dest_name = f"models/source_glb/{glb_name}"
        url = upload_glb(local_path, dest_name)
        
        # Determine model name from glb_name
        model_name = glb_name.replace('.glb', '')
        
        # Record in Firestore
        print(f"Updating Firestore for {model_name}...")
        db.collection('models').document(model_name).set({
            'glbUrl': url,
            'sourcePath': dest_name,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }, merge=True)

if __name__ == "__main__":
    sync_all_glbs()
