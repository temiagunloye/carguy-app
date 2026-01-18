# 3-Car Demo Quick Start Guide

## 🎯 Current Status

**STAGE**: Waiting for manual model downloads (Phase 1)

**COMPLETED**:
✅ Implementation plan created
✅ Directory structure set up
✅ Blender optimization script ready
✅ Blender anchor addition script ready
✅ Automated Firebase upload pipeline ready

**BLOCKED ON**: You need to download 3 GLB files from Sketchfab

---

## 📥 Step 1: Download Models (MANUAL - 15 minutes)

### Porsche 911

**Search URL**: https://sketchfab.com/search?features=downloadable&q=porsche+911&type=models

**What to look for**:
- License badge shows "CC Attribution" or "CC0" (NOT "CC-BY-NC")
- Downloadable button visible
- Realistic, high-quality preview
- Ideally 992 generation (2019+)

**Download steps**:
1. Click on promising model
2. Check license (must be commercial-OK)
3. Click "Download 3D Model"
4. Select **GLB** or **GLTF** format
5. Save as: `/Users/temiagunloye/Desktop/carguy-app/assets/raw-models/porsche_911_raw.glb`

**Recommended candidates** (check these first):
- Search "porsche 911 992"
- Search "porsche 911 gt3"
- Search "porsche 911 carrera"

---

### BMW M3

**Search URL**: https://sketchfab.com/search?features=downloadable&q=bmw+m3&type=models

**What to look for**:
- CC-BY or CC0 license
- G80 generation (2021+, distinctive large front grille)
- High detail

**Download as**: `/Users/temiagunloye/Desktop/carguy-app/assets/raw-models/bmw_m3_raw.glb`

**Recommended searches**:
- "bmw m3 g80"
- "bmw m3 competition"
- "bmw m3 2021"

---

### Mercedes-Benz AMG GT

**Search URL**: https://sketchfab.com/search?features=downloadable&q=mercedes+amg+gt&type=models

**What to look for**:
- CC-BY or CC0 license
- AMG GT coupe (not sedan/GLE/GLC)
- Sleek sports car design

**Download as**: `/Users/temiagunloye/Desktop/carguy-app/assets/raw-models/mercedes_amg_raw.glb`

**Recommended searches**:
- "mercedes amg gt r"
- "mercedes amg gt s"
- "mercedes amg gt coupe"

---

## ⚡ Step 2: Run Automated Pipeline (30 seconds)

Once you have all 3 files downloaded, run:

```bash
cd /Users/temiagunloye/Desktop/carguy-app
node scripts/process-models.js
```

This will automatically:
1. ✅ Validate each model loads
2. ✅ Optimize (decimate triangles, resize textures)
3. ✅ Add anchor empties for part swapping
4. ✅ Upload to Firebase Storage
5. ✅ Register in Firestore baseModels collection
6. ✅ Generate before/after stats

**Expected output**:
```
🚀 Starting car model processing pipeline...

============================================================
Processing: 2024 Porsche 911
============================================================
✅ Raw model found (45.2 MB)

🔧 Optimizing model...
Decimated Body: 180000 -> 95000 tris
✅ Optimized (4.2 MB)

⚓ Adding anchor points...
Created anchor: ANCHOR_WHEEL_FL at (1.2, 2.5, 0.3)
Created anchor: ANCHOR_WHEEL_FR at (-1.2, 2.5, 0.3)
... [14 more anchors]
✅ Anchors added (4.3 MB)

☁️  Uploading to Firebase Storage...
✅ Uploaded: https://storage.googleapis.com/carguy-app-demo.firebasestorage.app/models/base/porsche_911_2024_v2.glb

📝 Registering in Firestore...
✅ Registered in Firestore: baseModels/porsche_911_2024

✨ 2024 Porsche 911 processing complete!
```

---

## 📝 Step 3: Update License Info (5 minutes)

After pipeline completes, update Firestore manually in Firebase Console:

**URL**: https://console.firebase.google.com/project/carguy-app-demo/firestore/data/~2FbaseModels

For each car doc (porsche_911_2024, bmw_m3_2024, mercedes_amg_gt_2024):

1. Open document
2. Edit fields:
   - `license.type`: e.g., "CC-BY-4.0"
   - `license.attributionText`: e.g., "Porsche 911 by [Author Name] licensed under CC-BY-4.0" (copy from Sketchfab)
   - `sourceUrl`: Paste the Sketchfab model page URL

3. Click Update

---

## 🎨 Step 4: Download 2-3 MVP Parts (Optional, 10 minutes)

To test part swapping, download:

### Wheels (1 set)
**Search**: https://sketchfab.com/search?features=downloadable&q=car+wheel+rim&type=models
**License**: CC-BY or CC0
**Save as**: `/Users/temiagunloye/Desktop/carguy-app/assets/parts/wheels_01_raw.glb`

### Spoiler
**Search**: https://sketchfab.com/search?features=downloadable&q=car+spoiler&type=models
**License**: CC-BY or CC0
**Save as**: `/Users/temiagunloye/Desktop/carguy-app/assets/parts/spoiler_01_raw.glb`

### Exhaust Tips (optional)
**Search**: https://sketchfab.com/search?features=downloadable&q=exhaust+tips&type=models
**License**: CC-BY or CC0
**Save as**: `/Users/temiagunloye/Desktop/carguy-app/assets/parts/exhaust_01_raw.glb`

*Note: I'll create a separate script to process these parts after cars are done.*

---

## 🧪 Step 5: Test in App

Once models are uploaded:

1. Restart Expo: `npx expo start` (or reload if already running)
2. Open app → "Browse Demo Cars"
3. You should see 3 new cars in the list
4. Tap "2024 Porsche 911"
5. Model should load with textures ✅

---

## 📊 Quality Gate Checklist

Before proceeding to Phase 3 (app implementation), verify:

- [ ] All 3 cars load in app viewer
- [ ] No gray/missing textures
- [ ] All models <10MB (check stats output)
- [ ] No console errors during load
- [ ] FPS >30 on device

If any car fails:
- Check `assets/optimized-models/*_stats.json` for details
- May need to re-download a different model from Sketchfab
- Re-run pipeline: `node scripts/process-models.js`

---

## 🐛 Troubleshooting

### "Raw model not found"
✅ **Solution**: Ensure file is downloaded to exact path:
- `assets/raw-models/porsche_911_raw.glb`
- `assets/raw-models/bmw_m3_raw.glb`
- `assets/raw-models/mercedes_amg_raw.glb`

### "Blender command not found"
✅ **Solution**: Blender is installed at `/opt/homebrew/bin/blender`, should work automatically

### "Model size >10MB after optimization"
✅ **Solution**: Edit `scripts/process-models.js`, change target from `120000` to `80000` triangles

### "Firebase upload failed"
✅ **Solution**: Check that `functions/service-account-key.json` exists and is valid

### "Models don't load in app"
✅ **Solution**: 
1. Check Firebase Storage CORS: `gsutil cors set cors.json gs://carguy-app-demo.firebasestorage.app`
2. Verify files are public in Firebase Console

---

## 🚀 Next Steps (After Step 5 passes)

Once all 3 cars are loading successfully:

**Phase 2 Complete** ✅

**Phase 3**: Update app code (I'll handle this automatically):
1. Add "Exit" button to Browse Demo screen
2. Implement anchor auto-discovery in viewer
3. Add "Parts" floating button
4. Implement part swapping logic

Let me know when models are downloaded and I'll run the pipeline!
