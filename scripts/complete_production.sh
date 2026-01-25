#!/bin/bash
# ONE-COMMAND COMPLETION
# After generating images via Gemini, run this single script to complete everything

set -e

echo "🚀 FINAL PRODUCTION POLISH - ONE COMMAND COMPLETION"
echo "===================================================="
echo ""

# Check if images are ready
echo "📊 Checking for AI-generated images..."
echo ""

BMW_COUNT=$(find tmp/ai-renders/bmw_m3_2024 -name "*.png" 2>/dev/null | wc -l | tr -d ' ' || echo "0")
BRZ_COUNT=$(find tmp/ai-renders/subaru_brz_2024 -name "*.png" 2>/dev/null | wc -l | tr -d ' ' || echo "0")
AUDI_COUNT=$(find tmp/ai-renders/audi_rs6_2024 -name "*.png" 2>/dev/null | wc -l | tr -d ' ' || echo "0")
MERC_COUNT=$(find tmp/ai-renders/mercedes_c63_2024 -name "*.png" 2>/dev/null | wc -l | tr -d ' ' || echo "0")

echo "  BMW M3: $BMW_COUNT/10 images"
echo "  Subaru BRZ: $BRZ_COUNT/10 images"
echo "  Audi RS6: $AUDI_COUNT/10 images"
echo "  Mercedes C63: $MERC_COUNT/10 images"
echo ""

TOTAL=$((BMW_COUNT + BRZ_COUNT + AUDI_COUNT + MERC_COUNT))

if [ "$TOTAL" -lt 40 ]; then
    echo "⚠️  Only $TOTAL/40 images found"
    echo ""
    echo "📝 TO GENERATE IMAGES:"
    echo "   1. Open: https://gemini.google.com/app"
    echo "   2. Use prompts from: GEMINI_PROMPTS.md"
    echo "   3. Save images to: tmp/ai-renders/{car_id}/"
    echo "   4. Re-run this script"
    echo ""
    exit 1
fi

echo "✅ All 40 images ready!"
echo ""

# Upload each car
echo "📤 Uploading to Firebase Storage..."
echo ""

for car in bmw_m3_2024 subaru_brz_2024 audi_rs6_2024 mercedes_c63_2024; do
    echo "🚗 $car"
    node scripts/upload_car.js "$car" "tmp/ai-renders/$car"
done

echo ""
echo "🚀 Deploying to production..."
firebase deploy --only hosting

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Live site: https://carguy-app-demo.web.app/shop/simulator.html"
echo ""
echo "📝 TEST CHECKLIST:"
echo "  - [ ] BMW M3 displays white BMW with unique angles"
echo "  - [ ] Subaru BRZ displays blue BRZ with unique angles"
echo "  - [ ] Audi RS6 displays silver wagon with unique angles"
echo "  - [ ] Mercedes C63 displays black sedan with unique angles"
echo "  - [ ] Rotation is instant/smooth (image preloading working)"
echo "  - [ ] All backgrounds match specified aesthetics"
echo ""
