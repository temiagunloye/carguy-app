# Quick Manual Upload - 3 Steps to Get Models Working

## Step 1: Upload GLB Files to Firebase Storage (2 minutes)

1. Open: https://console.firebase.google.com/project/carguy-app-demo/storage/carguy-app-demo.firebasestorage.app/files

2. Navigate to or create path: `models/base/demo/`

3. Upload these 3 files (drag & drop):
   - From: `assets/optimized-models/porsche_911_2024.glb`
     Rename to: `porsche_911_2024_v1.glb`
   
   - From: `assets/optimized-models/bmw_m3_2023.glb`
     Rename to: `bmw_m3_2023_v1.glb`
   
   - From: `assets/optimized-models/subaru_brz_2024.glb`
     Rename to: `subaru_brz_2022_v1.glb`

4. For EACH uploaded file, click the file → "Download URL" → Copy the token-based URL

---

## Step 2: Create Firestore Documents (3 minutes)

1. Open: https://console.firebase.google.com/project/carguy-app-demo/firestore/databases/-default-/data/~2FbaseModels

2. Click "+ Add document"

### Document 1: porsche_911_2024
```
Document ID: porsche_911_2024

Fields:
- modelId (string): "porsche_911_2024"
- displayName (string): "2024 Porsche 911 Carrera 4S"
- make (string): "Porsche"
- model (string): "911"
- year (number): 2024
- glbUrl (string): <PASTE DOWNLOAD URL FROM STEP 1>
- storagePath (string): "gs://carguy-app-demo.firebasestorage.app/models/base/demo/porsche_911_2024_v1.glb"
- version (string): "v1"
- demo (boolean): true
- active (boolean): true
- bodyStyle (string): "coupe"
- glbSize (number): 2253568
```

### Document 2: bmw_m3_2023
```
Document ID: bmw_m3_2023

Fields:
- modelId (string): "bmw_m3_2023"
- displayName (string): "2023 BMW M3 Touring"
- make (string): "BMW"
- model (string): "M3"
- year (number): 2023
- glbUrl (string): <PASTE DOWNLOAD URL FROM STEP 1>
- storagePath (string): "gs://carguy-app-demo.firebasestorage.app/models/base/demo/bmw_m3_2023_v1.glb"
- version (string): "v1"
- demo (boolean): true
- active (boolean): true
- bodyStyle (string): "wagon"
- glbSize (number): 3014656
```

### Document 3: subaru_brz_2022
```
Document ID: subaru_brz_2022

Fields:
- modelId (string): "subaru_brz_2022"
- displayName (string): "2022 Subaru BRZ tS"
- make (string): "Subaru"
- model (string): "BRZ"
- year (number): 2022
- glbUrl (string): <PASTE DOWNLOAD URL FROM STEP 1>
- storagePath (string): "gs://carguy-app-demo.firebasestorage.app/models/base/demo/subaru_brz_2022_v1.glb"
- version (string): "v1"
- demo (boolean): true
- active (boolean): true
- bodyStyle (string): "coupe"
- glbSize (number): 1224704
```

---

## Step 3: Test in App

1. Reload the app (if already running)
2. Navigate to "Demo Cars" page
3. Click on any of the 3 new models:
   - 2024 Porsche 911 Carrera 4S
   - 2023 BMW M3 Touring
   - 2022 Subaru BRZ tS
4. 3D viewer should load the model

---

## ✅ What I Already Did

- Updated `src/data/demoCars.ts` to include `baseModelId` references
- Porsche → `baseModelId: 'porsche_911_2024'`
- BMW → `baseModelId: 'bmw_m3_2023'`
- Subaru → `baseModelId: 'subaru_brz_2022'`

The app is wired to load models from Firestore baseModels collection using these IDs.

---

## Troubleshooting

**Models not loading?**
- Check that glbUrl in Firestore is correct (should start with https://firebasestorage.googleapis.com/)
- Verify Storage files are public (click file → "Permissions" tab → should show "allUsers")
- Check browser console for errors
- Ensure Expo dev server is running

**Can't find Storage path?**
- Storage UI: Click folder icon next to "carguy-app-demo.firebasestorage.app"
- Navigate: models → base → demo
- If "demo" folder doesn't exist, create it first

**Firestore doc creation failing?**
- Make sure Document ID matches exactly (e.g., `porsche_911_2024`)
- All fields are case-sensitive
- Numbers should be type "number", not string
- Booleans should be type "boolean", not string
