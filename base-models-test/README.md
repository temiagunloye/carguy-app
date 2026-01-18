# Base Models Test Environment

## 🎯 Purpose
Validate 3 base car models before integrating into the app.

## 📁 Folder Structure
```
base-models-test/
├── README.md                  ← You are here
├── DOWNLOAD_GUIDE.md          ← Step-by-step download instructions
├── test-viewer.html           ← Local test viewer
├── honda_civic.glb            ← Download from Sketchfab
├── toyota_camry.glb           ← Download from Sketchfab
├── mercedes_eclass.glb        ← Download from Sketchfab
└── licenses/                  ← License documentation
    ├── honda_civic.txt
    ├── honda_civic_screenshot.png
    ├── toyota_camry.txt
    ├── toyota_camry_screenshot.png
    ├── mercedes_eclass.txt
    └── mercedes_eclass_screenshot.png
```

## 🚀 Quick Start

### Step 1: Download Models
Follow instructions in `DOWNLOAD_GUIDE.md` to get 3 GLB files from Sketchfab.

### Step 2: Test Locally
```bash
# Open test viewer in browser
open test-viewer.html

# OR start a local server
python3 -m http.server 8000
# Then open: http://localhost:8000/test-viewer.html
```

### Step 3: Check Mobile Performance
```bash
# Find your computer's IP
ipconfig getifaddr en0  # macOS WiFi
# OR
ipconfig getifaddr en1  # macOS Ethernet

# On your phone, visit:
# http://YOUR-IP:8000/test-viewer.html
```

## ✅ Validation Checklist

- [ ] All 3 models downloaded (GLB format)
- [ ] test-viewer.html shows all 3 models
- [ ] No texture errors (models fully colored)
- [ ] Load time <3 seconds per model
- [ ] Smooth rotation on desktop
- [ ] Smooth rotation on phone
- [ ] License documentation complete
- [ ] No console errors in DevTools

## 🚦 Gate Decision

**PASS** → Proceed to Firebase upload + app integration
**FAIL** → Find replacement models, re-test

## 📝 Notes

Save any observations here:
- Model quality issues?
- Performance problems?
- File sizes too large?
