#!/bin/bash
# COMPLETE CAR RENDER PIPELINE - Run this after generating images via Gemini

set -e  # Exit on error

echo "🚀 COMPLETE CAR RENDER DEPLOYMENT PIPELINE"
echo "=========================================="
echo ""

# Check which cars have complete image sets
echo "📊 Checking image status..."
echo ""

for car in subaru_brz_2024 audi_rs6_2024 mercedes_c63_2024; do
    dir="tmp/final-renders/$car"
    if [ -d "$dir" ]; then
        count=$(ls "$dir"/*.png 2>/dev/null | wc -l | tr -d ' ')
        echo "  $car: $count/10 images"
        
        if [ "$count" -eq 10 ]; then
            echo "    ✅ READY TO UPLOAD"
            
            # Upload to Firebase
            echo "    📤 Uploading to Firebase Storage..."
            node scripts/upload_car.js "$car" "$dir"
            
            echo "    ✅ $car COMPLETE!"
            echo ""
        else
            echo "    ⏳ Waiting for $(( 10 - count )) more images"
            echo ""
        fi
    else
        echo "  $car: 0/10 images (directory not found)"
        echo "    ⏳ Waiting for all 10 images"
        echo ""
    fi
done

# Deploy to production
echo "🚀 Deploying to production..."
firebase deploy --only hosting

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🌐 Live site: https://carguy-app-demo.web.app/shop/simulator.html"
echo ""
echo "📝 Test checklist:"
echo "  1. Select each car from dropdown"
echo "  2. Verify correct car renders (not Porsche)"
echo "  3. Test rotation through all angles"
echo "  4. Check image quality and consistency"
