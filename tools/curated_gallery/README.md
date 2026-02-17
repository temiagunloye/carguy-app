# Curated Render Gallery

**INTERNAL TOOL ONLY — DO NOT DEPLOY**

## Purpose
Visual verification of approved render sets before they go live on the website.

## Usage
```bash
open tools/curated_gallery/index.html
```

## Current Curated Builds

### ✅ Ready (10/10)
- **Subaru BRZ Custom** - `tmp/final-renders/subaru_brz_2022_matte_black/`
- **Porsche Manthey Racing** - `renders/batch_01/porsche_911_2024_army_green/`
- **Audi RS6 Custom** - `renders/batch_01/audi_rs6_2024_nardo_grey/`

### ⚠️ Partial (6/10)
- **Mercedes C63 Stock** - `tmp/final-renders/mercedes_c63_2024/` (angles 01-06 only)

## Rules
1. Only builds listed above are approved for production use
2. No fallback to stock photos or placeholder images
3. Missing angles must show "not available" rather than substitutes
4. New renders must be added to this curated list before deployment
