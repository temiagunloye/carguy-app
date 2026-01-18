#!/usr/bin/env node

/**
 * Manually create anchor metadata JSON files for the 3 base models
 * Based on the dimensions logged by add_anchors.py
 */

const fs = require('fs');
const path = require('path');

// Anchor data extracted from Blender script output
const anchorData = {
    porsche_911_2024: {
        ANCHOR_WHEEL_FL: { x: -51.9903, y: 40.3131, z: -49.6004 },
        ANCHOR_WHEEL_FR: { x: 43.6212, y: 40.3131, z: -49.6004 },
        ANCHOR_WHEEL_RL: { x: -51.9903, y: 8.3516, z: -49.6004 },
        ANCHOR_WHEEL_RR: { x: 43.6212, y: 8.3516, z: -49.6004 },
        ANCHOR_FRONT_CENTER_LOW: { x: -4.1846, y: 51.017, z: -49.8004 },
        ANCHOR_REAR_CENTER_LOW: { x: -4.1846, y: -2.3523, z: -49.8004 },
        ANCHOR_SIDE_LEFT_LOW: { x: -72.5285, y: 24.3323, z: -49.7004 },
        ANCHOR_SIDE_RIGHT_LOW: { x: 64.1594, y: 24.3323, z: -49.7004 },
        ANCHOR_TRUNK_CENTER: { x: -4.1846, y: 5.6881, z: 31.8056 },
        ANCHOR_EXHAUST_L: { x: -31.5021, y: -2.4023, z: -49.7004 },
        ANCHOR_EXHAUST_R: { x: 23.133, y: -2.4023, z: -49.7004 }
    },
    bmw_m3_2023: {
        ANCHOR_WHEEL_FL: { x: -0.7273, y: 1.4426, z: -0.0396 },
        ANCHOR_WHEEL_FR: { x: 0.7273, y: 1.4426, z: -0.0396 },
        ANCHOR_WHEEL_RL: { x: -0.7273, y: -1.4481, z: -0.0396 },
        ANCHOR_WHEEL_RR: { x: 0.7273, y: -1.4481, z: -0.0396 },
        ANCHOR_FRONT_CENTER_LOW: { x: -0.0000, y: 2.4561, z: -0.2396 },
        ANCHOR_REAR_CENTER_LOW: { x: -0.0000, y: -2.4616, z: -0.2396 },
        ANCHOR_SIDE_LEFT_LOW: { x: -1.089, y: -0.0027, z: -0.1396 },
        ANCHOR_SIDE_RIGHT_LOW: { x: 1.089, y: -0.0027, z: -0.1396 },
        ANCHOR_TRUNK_CENTER: { x: -0.0000, y: -1.6889, z: 1.2739 },
        ANCHOR_EXHAUST_L: { x: -0.4156, y: -2.5116, z: -0.1396 },
        ANCHOR_EXHAUST_R: { x: 0.4156, y: -2.5116, z: -0.1396 }
    },
    subaru_brz_2022: {
        ANCHOR_WHEEL_FL: { x: -0.7029, y: 1.2806, z: -0.7 },
        ANCHOR_WHEEL_FR: { x: 0.7028, y: 1.2806, z: -0.7 },
        ANCHOR_WHEEL_RL: { x: -0.7029, y: -1.2799, z: -0.7 },
        ANCHOR_WHEEL_RR: { x: 0.7028, y: -1.2799, z: -0.7 },
        ANCHOR_FRONT_CENTER_LOW: { x: -0.0001, y: 2.1841, z: -0.9 },
        ANCHOR_REAR_CENTER_LOW: { x: -0.0001, y: -2.1834, z: -0.9 },
        ANCHOR_SIDE_LEFT_LOW: { x: -1.0542, y: 0.0003, z: -0.8 },
        ANCHOR_SIDE_RIGHT_LOW: { x: 1.054, y: 0.0003, z: -0.8 },
        ANCHOR_TRUNK_CENTER: { x: -0.0001, y: -1.4933, z: 1.0182 },
        ANCHOR_EXHAUST_L: { x: -0.4017, y: -2.2334, z: -0.8 },
        ANCHOR_EXHAUST_R: { x: 0.4016, y: -2.2334, z: -0.8 }
    }
};

// Create tmp/anchors directory
const tmpDir = path.join(__dirname, '../tmp/anchors');
if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
}

// Write JSON files
for (const [modelId, anchorPoints] of Object.entries(anchorData)) {
    const outputData = {
        anchorPoints,
        anchorsVersion: 'v1',
        anchorCount: Object.keys(anchorPoints).length
    };

    const outputPath = path.join(tmpDir, `${modelId}_anchors.json`);
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
    console.log(`✅ Created: ${outputPath}`);
    console.log(`   Anchors: ${outputData.anchorCount}`);
}

console.log('\n✅ All anchor JSON files created!');
console.log('\nNext: Run update scripts for each model:');
console.log('  node scripts/update-base-model-anchors.js porsche_911_2024 tmp/anchors/porsche_911_2024_anchors.json');
console.log('  node scripts/update-base-model-anchors.js bmw_m3_2023 tmp/anchors/bmw_m3_2023_anchors.json');
console.log('  node scripts/update-base-model-anchors.js subaru_brz_2022 tmp/anchors/subaru_brz_2022_anchors.json');
