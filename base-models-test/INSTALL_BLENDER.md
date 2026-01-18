# 🔧 Blender Installation + Model Optimization

## Step 1: Install Blender (5 minutes)

**Mac Installation:**
```bash
# Option 1: Homebrew (if you have it)
brew install --cask blender

# Option 2: Direct Download
# Visit: https://www.blender.org/download/
# Click "Download Blender 4.0" (or latest)
# Open DMG, drag to Applications
```

**Quick Download:** https://www.blender.org/download/

---

## Step 2: Run Optimization Script (After Blender Installed)

Once Blender is installed, run this command:

```bash
cd ~/Desktop/carguy-app/base-models-test
/Applications/Blender.app/Contents/MacOS/Blender --background --python optimize_models.py
```

This will automatically optimize both Toyota and Mercedes files.

---

## What the Script Does

1. **Opens each oversized GLB**
2. **Reduces polygons** by 75% (keeps visual quality)
3. **Compresses textures** to 1024×1024
4. **Exports optimized GLB** with "_optimized" suffix
5. **Reports file sizes**

**Expected Results:**
- Toyota Camry: 31MB → ~5-7MB
- Mercedes E-Class: 24MB → ~5-7MB

---

## Next Steps

1. Install Blender (5 min)
2. Tell me when done
3. I'll create the optimization script
4. You run one command
5. Test optimized models!

**Installing now?**
