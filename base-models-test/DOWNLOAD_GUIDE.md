# 📥 DOWNLOAD GUIDE - Base Models

**🎯 Goal:** Download 3 GLB car models from Sketchfab (takes ~15 minutes)

---

## ⚡ QUICK START - Click These Links

### 1️⃣ Honda Civic

**Direct Search Link (Filtered):**
👉 **https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=honda+civic&sort_by=-pertinence&type=models**

**What to Do:**
1. Click link above (opens Sketchfab with downloadable + CC-BY filter)
2. Browse results, pick ANY model that looks good (has textures, not gray)
3. Click model → Click "Download 3D Model" (free account required)
4. Select format: **glTF Binary (.glb)**
5. Save as: `honda_civic.glb` in this folder

**Quick Tips:**
- Look for models with 👍 likes (usually better quality)
- Avoid models with "low poly" or "stylized" if you want realism
- Check the preview rotates smoothly

---

### 2️⃣ Toyota Camry

**Direct Search Link (Filtered):**
👉 **https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=toyota+camry&sort_by=-pertinence&type=models**

**What to Do:**
1. Click link above
2. Pick any Camry model (2015-2022 years are common)
3. Download as **glTF Binary (.glb)**
4. Save as: `toyota_camry.glb` in this folder

---

### 3️⃣ Mercedes E-Class (W211 / 2003 Era)

**Direct Search Link (Filtered):**
👉 **https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=mercedes+e-class&sort_by=-pertinence&type=models**

**Alternative Search (More Specific):**
👉 **https://sketchfab.com/search?features=downloadable&licenses=322a749bcfa841b29dff1e8a1bb74b0b&q=mercedes+w211&sort_by=-pertinence&type=models**

**What to Do:**
1. Click either link above
2. Look for sedan body style (4-door)
3. W211 = 2002-2009 generation (matches 2003)
4. Download as **glTF Binary (.glb)**
5. Save as: `mercedes_eclass.glb` in this folder

---

## 📋 After Downloading

**You should have:**
```
base-models-test/
├── honda_civic.glb      ✅
├── toyota_camry.glb     ✅
├── mercedes_eclass.glb  ✅
```

**Next Step:** Open `test-viewer.html` to see if they load!

---

## 📸 License Documentation (IMPORTANT)

For each model, you need to save attribution info:

### Example: Honda Civic

**1. Screenshot the Sketchfab page**
- Take screenshot showing license badge
- Save to: `licenses/honda_civic_screenshot.png`

**2. Create text file**
- File: `licenses/honda_civic.txt`
- Contents:
```
Model: Honda Civic
Creator: [Username from Sketchfab]
License: CC-BY 4.0 (Creative Commons Attribution)
Source: [paste exact Sketchfab model URL]
Attribution Required: Yes
Attribution Text: "Honda Civic 3D model by [Creator] on Sketchfab (sketchfab.com)"
Downloaded: 2026-01-12
Commercial Use: Allowed with attribution
```

**Repeat for Toyota Camry and Mercedes E-Class**

---

## 🆘 Troubleshooting

**Q: Link says "No models found"**
- Remove filters and search manually: https://sketchfab.com/search?q=honda+civic
- Filter manually: Check "Downloadable" + select "CC-BY" license

**Q: Download button is grayed out**
- You need a free Sketchfab account - sign up at sketchfab.com

**Q: Don't see .glb format option**
- All downloadable Sketchfab models support GLB export
- Select "glTF" or "glTF Binary" (both are .glb)

**Q: Model looks different after download**
- Sketchfab auto-converts - some texture compression may occur
- If it looks bad, try a different model from search results

---

## ✅ Ready to Test?

Once you have all 3 .glb files:

```bash
cd ~/Desktop/carguy-app/base-models-test
open test-viewer.html
```

The test viewer will show if they loaded correctly!
