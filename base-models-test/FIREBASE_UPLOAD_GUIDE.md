# 🔥 Firebase Storage Upload Guide

## Step 1: Upload Models to Firebase Storage (5 minutes)

### Open Firebase Console
1. Go to: https://console.firebase.google.com/project/carguy-app-demo/storage
2. Click on "Files" tab

### Create Folder Structure
1. Click "Create folder" 
2. Name it: `models`
3. Open `models` folder
4. Click "Create folder"
5. Name it: `base`

### Upload the 3 GLB Files
From: `/Users/temiagunloye/Desktop/carguy-app/base-models-test/`

Drag and drop these files into the `models/base/` folder:
- ✅ honda_civic.glb (rename to `honda_civic_v1.glb`)
- ✅ toyota_camry.glb (rename to `toyota_camry_v1.glb`)
- ✅ mercedes_eclass.glb (rename to `mercedes_eclass_v1.glb`)

### Set Public Access (IMPORTANT)
For each uploaded file:
1. Click the three dots ⋮ next to the file
2. Select "Get download URL"
3. Copy the URL (we'll use this in Firestore)

**Alternative quick method:**
1. Select all 3 files
2. Click "Make public" (if option available)

---

## Step 2: Create Firestore Collection (10 minutes)

### Open Firestore Console
1. Go to: https://console.firebase.google.com/project/carguy-app-demo/firestore
2. Click "Start collection"

### Create `baseModels` Collection

**Collection ID:** `baseModels`

---

### Add Document 1: Honda Civic

**Document ID:** (Auto-ID)

**Fields:**
```
modelId: "honda_civic_2022"
displayName: "Honda Civic"
year: 2022
make: "Honda"
model: "Civic"
bodyStyle : "sedan"
glbUrl: "[paste download URL from Storage]"
glbSize: 841212
active: true

license: {
  type: "CC-BY 4.0"
  source: "Sketchfab"
  attribution: "Model from Sketchfab"
  commercial: true
}

metadata: {
  polyCount: 15000
  version: "1.0"
  dateAdded: [Timestamp - click "ADD FIELD" → select Timestamp → "Now"]
}

tags: ["honda", "civic", "sedan", "2022"]
```

---

### Add Document 2: Toyota Camry

**Document ID:** (Auto-ID)

**Fields:**
```
modelId: "toyota_camry_2018"
displayName: "Toyota Camry"
year: 2018
make: "Toyota"
model: "Camry"
bodyStyle: "sedan"
glbUrl: "[paste download URL from Storage]"
glbSize: 2150196
active: true

license: {
  type: "CC-BY 4.0"
  source: "Sketchfab"
  attribution: "Model from Sketchfab"
  commercial: true
}

metadata: {
  polyCount: 120000
  version: "1.0"
  dateAdded: [Timestamp - Now]
}

tags: ["toyota", "camry", "sedan", "2018"]
```

---

### Add Document 3: Mercedes E-Class

**Document ID:** (Auto-ID)

**Fields:**
```
modelId: "mercedes_eclass_2005"
displayName: "Mercedes-Benz E-Class"
year: 2005
make: "Mercedes-Benz"
model: "E-Class"
bodyStyle: "sedan"
glbUrl: "[paste download URL from Storage]"
glbSize: 2452816
active: true

license: {
  type: "CC-BY 4.0"
  source: "Sketchfab"
  attribution: "Model from Sketchfab"
  commercial: true
}

metadata: {
  polyCount: 119981
  version: "1.0"
  dateAdded: [Timestamp - Now]
}

tags: ["mercedes", "eclass", "luxury", "sedan", "2005"]
```

---

## ✅ Verification Checklist

After completing both steps:

- [ ] 3 GLB files uploaded to `models/base/` in Firebase Storage
- [ ] All 3 files have download URLs copied
- [ ] `baseModels` collection created in Firestore
- [ ] 3 documents added (Honda, Toyota, Mercedes)
- [ ] Each document has `glbUrl` field with correct Storage URL
- [ ] All fields match the structure above

---

## 🎯 Next Step (After Upload)

Once done, tell me and I'll:
1. Create the model selector screen
2. Integrate viewer to load from Firestore
3. Test on your device

**Estimated total time: 15 minutes**
