#!/bin/bash

# scripts/assert_canonical_contract.sh

EXIT_CODE=0
echo "🔒 Asserting Canonical Render Contract..."

# 1. Check for manifest.json references (excluding top 10 lines for contract comments)
echo "Checking for 'manifest.json' references in website/js..."
# We check all JS files, but for visualizer-v3.js we skip header
if find website/js -name "*.js" -not -name "visualizer-v3.js" -print0 | xargs -0 grep "manifest.json"; then
    echo "❌ FAIL: Found 'manifest.json' in other JS files"
    EXIT_CODE=1
fi

if tail -n +11 website/js/visualizer-v3.js | grep "manifest.json"; then
    echo "❌ FAIL: Found 'manifest.json' references in visualizer-v3.js body"
    EXIT_CODE=1
fi

# 2. Check for currentCar.renderUrls (excluding top 10 lines)
echo "Checking for 'currentCar.renderUrls' usage in visualizer-v3.js..."
if tail -n +11 website/js/visualizer-v3.js | grep "currentCar.renderUrls"; then
    echo "❌ FAIL: Found active 'currentCar.renderUrls' usage in visualizer-v3.js body"
    EXIT_CODE=1
else
    echo "✅ PASS: No 'currentCar.renderUrls' usage found."
fi

# 3. Check for non-canonical asset paths
echo "Checking for non-canonical asset paths (website/public, /tmp, /Desktop)..."
# We scan visualizer-v3.js for strings starting with /Pre-check
BAD_PATHS=("website/public" "/tmp" "/Desktop" "assets/cars/public")
for path in "${BAD_PATHS[@]}"; do
    if grep -r "$path" website/js/visualizer-v3.js; then
        echo "❌ FAIL: Found forbidden path '$path' in visualizer-v3.js"
        EXIT_CODE=1
    fi
done

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ CANONICAL CONTRACT VERIFIED."
else
    echo "❌ CANONICAL CONTRACT VIOLATED."
fi

exit $EXIT_CODE
