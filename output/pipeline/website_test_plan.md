# Website Test Plan - Canonical Pipeline

## Changes Made

### 1. visualizer-v3.js Fixes
- **setAngle()**: Now uses `currentBuildId` directly with `/assets/cars/{buildId}/angle_XX.png`
- **NO fallback**: Removed `currentCar.renderUrls` fallback - missing renders show "Render Pending"
- **404 handling**: Added `img.onerror` to show Render Pending on missing images
- **populateBuildsTab()**: Sets both `currentBuild` and `currentBuildId` on selection

### 2. Asset Structure
- ✅ Symlink: `website/assets` → `../assets`
- ✅ Canonical path: `/assets/cars/<buildId>/angle_XX.png`
- ✅ base_to_builds_map.json loaded at runtime

### 3. Build Status (7/16 complete)
**Complete (10/10)**:
- audi_rs6_custom_blue
- bmw_m3_stock_white
- bmw_m3_custom_red
- c63_stock_black
- brz_stock_blue
- brz_custom_matte
- gt3_manthey_green

**Partial**: audi_rs6_stock_grey (6/10)
**Missing**: 8 builds (0/10)

---

## Test URLs

### Local
```
http://localhost:8000/shop/simulator.html
```

### Firebase
```
https://YOUR-PROJECT.web.app/shop/simulator.html
```

---

## Manual Test Cases

### TEST 1: RS6 Base → Stock Grey (Partial - Should Show 6 Angles)
1. Open simulator
2. Select "Audi RS6 Avant" from dropdown
3. ✅ **EXPECT**: Loads `audi_rs6_stock_grey`
4. ✅ **EXPECT**: Angles 01-06 load
5. ✅ **EXPECT**: Angles 07-10 show "Render Pending"

### TEST 2: RS6 → Ultra Blue Build (Complete - Should Show All Blue)
1. Select "Audi RS6 Avant"
2. Click "Builds" tab
3. Click "audi_rs6_custom_blue" card
4. ✅ **EXPECT**: All 10 angles show BLUE RS6
5. ✅ **EXPECT**: Rotation works smoothly
6. ✅ **EXPECT**: NO grey stock images appear

### TEST 3: Porsche GT3 Base → Stock Red (Missing - Should Show Blank)
1. Select "Porsche 911 GT3"
2. ✅ **EXPECT**: "Render Pending" overlay shows
3. ✅ **EXPECT**: NO photos of any car appear
4. ✅ **EXPECT**: All 10 angle dots show but image is blank/preview

### TEST 4: GT3 → Manthey Green Build (Complete - Should Show Green)
1. Select "Porsche 911 GT3"
2. Click "Builds" tab
3. ✅ **EXPECT**: "gt3_manthey_green" card appears
4. Click the card
5. ✅ **EXPECT**: Green GT3 Manthey loads (all 10 angles)
6. ✅ **EXPECT**: Rotation works

### TEST 5: 911 Base → Stock (Missing - Should Show Blank)
1. Select "Porsche 911"
2. ✅ **EXPECT**: "Render Pending" shows
3. ✅ **EXPECT**: NO fallback to any other car

### TEST 6: BRZ → Stock Blue (Complete - Should Show All)
1. Select "Subaru BRZ"
2. ✅ **EXPECT**: All 10 angles of blue BRZ load
3. ✅ **EXPECT**: Smooth rotation

---

## Hard Refresh

**Before testing**, clear browser cache:
- **Chrome/Edge**: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Win)
- **Firefox**: `Cmd+Shift+R` (Mac) / `Ctrl+F5` (Win)
- **Safari**: `Cmd+Option+R`

Or open DevTools → Network → Check "Disable cache"

---

## Deployment

### 1. Verify Local First
```bash
# Serve locally
python3 -m http.server 8000 --directory website

# Open in browser
open http://localhost:8000/shop/simulator.html
```

### 2. Deploy to Firebase
```bash
firebase deploy --only hosting
```

### 3. Verify Production
```
https://YOUR-PROJECT.web.app/shop/simulator.html?carId=audi_rs6
```

---

## Expected Results Summary

| Base | Default Stock | Status | Builds Tab |
|------|---------------|--------|------------|
| audi_rs6 | audi_rs6_stock_grey | Partial (6/10) | audi_rs6_custom_blue ✅, audi_rs6_bbs_mesh ❌ |
| bmw_m3 | bmw_m3_stock_white | Complete ✅ | bmw_m3_custom_red ✅, bmw_m3_toronto_red_bbs_fir ❌ |
| mercedes_c63 | c63_stock_black | Complete ✅ | mercedes_c63_rohana_matte_coal ❌ |  
| subaru_brz | brz_stock_blue | Complete ✅ | brz_custom_matte ✅, subaru_brz_te37_matte_coal ❌ |
| porsche_911 | porsche_911_stock | Missing ❌ | porsche_911_manthey_carbon_disc ❌, porsche_911_camo_green ❌ |
| porsche_gt3 | porsche_gt3_stock_red | Missing ❌ | gt3_manthey_green ✅ |

✅ = 10/10 renders exist
❌ = 0/10 renders (will show "Render Pending")
Partial = Some angles missing

---

## Bug Fixes Confirmed

1. **RS6 Ultra Blue**: Now loads correct blue buildId (`audi_rs6_custom_blue`)
2. **GT3 Stock**: Shows "Render Pending" instead of photos
3. **Manthey Green**: Appears in GT3 Builds tab and loads correctly

---

## Next Steps

Generate missing builds using:
```bash
# See queue
cat output/pipeline/render_queue.json

# After generating each build
bash scripts/import_to_canonical.sh <buildId> <artifacts-dir>

# Verify
bash scripts/master_pipeline.sh checklist
```
