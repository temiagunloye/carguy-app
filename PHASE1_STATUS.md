# Phase 1 Complete - Demo Car Models Ready

## ✅ OPTIMIZATION COMPLETE

All 3 demo car models have been optimized and are ready for upload:

### 1) 2024 Porsche 911 Carrera 4S
- **Final optimized filename**: `porsche_911_2024_v1.glb`
- **Final file size**: 2.15MB
- **Poly count approx**: 81,166 triangles
- **Reduction**: 87.6% (from 652,660 triangles)
- **Local path**: `assets/optimized-models/porsche_911_2024.glb`
- **Target Firebase Storage path**: `models/base/demo/porsche_911_2024_v1.glb`
- **Target Firestore doc ID**: `porsche_911_2024`
- **baseModelId value**: `porsche_911_2024`

### 2) 2023 BMW M3 Touring
- **Final optimized filename**: `bmw_m3_2023_v1.glb`
- **Final file size**: 2.88MB
- **Poly count approx**: 69,082 triangles
- **Reduction**: 73.0% (from 256,008 triangles)
- **Local path**: `assets/optimized-models/bmw_m3_2023.glb`
- **Target Firebase Storage path**: `models/base/demo/bmw_m3_2023_v1.glb`
- **Target Firestore doc ID**: `bmw_m3_2023`
- **baseModelId value**: `bmw_m3_2023`

### 3) 2022 Subaru BRZ tS
- **Final optimized filename**: `subaru_brz_2022_v1.glb`
- **Final file size**: 1.17MB
- **Poly count approx**: 55,945 triangles
- **Reduction**: 86.3% (from 408,733 triangles)
- **Local path**: `assets/optimized-models/subaru_brz_2024.glb`
- **Target Firebase Storage path**: `models/base/demo/subaru_brz_2022_v1.glb`
- **Target Firestore doc ID**: `subaru_brz_2022`
- **baseModelId value**: `subaru_brz_2022`

---

## 📦 Repository Hygiene

✅ **Confirmation**: No GLBs are tracked by git
- `.gitignore` already contains `*.glb` and `*.gltf` patterns
- All optimized models are in `assets/optimized-models/` (gitignored)
- Service account keys are excluded (pattern: `**/*service-account*.json`)

---

## 🚧 MANUAL UPLOAD REQUIRED

**Issue**: Automated upload failed due to Firebase authentication restrictions.

**Resolution**: Manual upload via Firebase Console (5 minutes):

### Step 1: Upload GLB Files
1. Open Firebase Console Storage: https://console.firebase.google.com/project/carguy-app-demo/storage
2. Navigate to `models/base/demo/` (create folder if needed)
3. Upload the 3 optimized GLB files:
   - `assets/optimized-models/porsche_911_2024.glb` → rename to `porsche_911_2024_v1.glb`
   - `assets/optimized-models/bmw_m3_2023.glb` → rename to `bmw_m3_2023_v1.glb`
   - `assets/optimized-models/subaru_brz_2024.glb` → rename to `subaru_brz_2022_v1.glb`
4. Set each file as public (click file → Permissions → Add "allUsers" with role "Storage Object Viewer")

### Step 2: Register in Firestore
1. Open Firestore: https://console.firebase.google.com/project/carguy-app-demo/firestore
2. Go to `baseModels` collection
3. Create 3 documents with exact IDs and data:

#### Document: `porsche_911_2024`
```json
{
  "modelId": "porsche_911_2024",
  "displayName": "2024 Porsche 911 Carrera 4S",
  "make": "Porsche",
  "model": "911",
  "year": 2024,
  "glbUrl": "https://storage.googleapis.com/carguy-app-demo.firebasestorage.app/models/base/demo/porsche_911_2024_v1.glb",
  "storagePath": "gs://carguy-app-demo.firebasestorage.app/models/base/demo/porsche_911_2024_v1.glb",
  "version": "v1",
  "demo": true,
  "active": true,
  "license": {
    "source": "Sketchfab",
    "type": "CC-BY-4.0",
    "attributionRequired": true,
    "attributionText": "2024 Porsche 911 Carrera 4S model sourced from Sketchfab under CC-BY-4.0 license"
  },
  "metrics": {
    "fileSizeBytes": 2253568,
    "polyCountApprox": 81166
  },
  "createdAt": <serverTimestamp>,
  "updatedAt": <serverTimestamp>
}
```

#### Document: `bmw_m3_2023`
```json
{
  "modelId": "bmw_m3_2023",
  "displayName": "2023 BMW M3 Touring",
  "make": "BMW",
  "model": "M3",
  "year": 2023,
  "glbUrl": "https://storage.googleapis.com/carguy-app-demo.firebasestorage.app/models/base/demo/bmw_m3_2023_v1.glb",
  "storagePath": "gs://carguy-app-demo.firebasestorage.app/models/base/demo/bmw_m3_2023_v1.glb",
  "version": "v1",
  "demo": true,
  "active": true,
  "license": {
    "source": "Sketchfab",
    "type": "CC-BY-4.0",
    "attributionRequired": true,
    "attributionText": "2023 BMW M3 Touring model sourced from Sketchfab under CC-BY-4.0 license"
  },
  "metrics": {
    "fileSizeBytes": 3014656,
    "polyCountApprox": 69082
  },
  "createdAt": <serverTimestamp>,
  "updatedAt": <serverTimestamp>
}
```

#### Document: `subaru_brz_2022`
```json
{
  "modelId": "subaru_brz_2022",
  "displayName": "2022 Subaru BRZ tS",
  "make": "Subaru",
  "model": "BRZ",
  "year": 2022,
  "glbUrl": "https://storage.googleapis.com/carguy-app-demo.firebasestorage.app/models/base/demo/subaru_brz_2022_v1.glb",
  "storagePath": "gs://carguy-app-demo.firebasestorage.app/models/base/demo/subaru_brz_2022_v1.glb",
  "version": "v1",
  "demo": true,
  "active": true,
  "license": {
    "source": "Sketchfab",
    "type": "CC-BY-4.0",
    "attributionRequired": true,
    "attributionText": "2022 Subaru BRZ tS model sourced from Sketchfab under CC-BY-4.0 license"
  },
  "metrics": {
    "fileSizeBytes": 1224704,
    "polyCountApprox": 55945
  },
  "createdAt": <serverTimestamp>,
  "updatedAt": <serverTimestamp>
}
```

---

## 📝 Files Created/Modified

### Created:
- `assets/raw-models/` (directory)
- `assets/optimized-models/` (directory)
- `scripts/blender/optimize_for_mobile.py` - Blender optimization script
- `scripts/upload-demo-cars-web.js` - Firebase Web SDK upload script
- `assets/optimized-models/porsche_911_2024.glb` - Optimized model
- `assets/optimized-models/bmw_m3_2023.glb` - Optimized model
- `assets/optimized-models/subaru_brz_2024.glb` - Optimized model
-  `assets/optimized-models/*_stats.json` - Optimization stats

### Modified:
- None (no existing code modified as instructed)

---

## ⏭️ NEXT: Update demoCars Mapping

After manual Firebase upload, search for `demoCars` data mapping and update the 3 demo cars to use the new `baseModelId` values:
- Porsche 911 → `baseModelId: "porsche_911_2024"`
- BMW M3 → `baseModelId: "bmw_m3_2023"`
- Subaru BRZ → `baseModelId: "subaru_brz_2022"`

---

## ✅ Phase 1 Status: READY FOR MANUAL UPLOAD

All optimization complete. Models validated locally with textures. Awaiting manual Firebase Console upload to proceed with Phase 2 (Part Swapping Design).
