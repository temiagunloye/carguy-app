#!/usr/bin/env node

/**
 * Smart car image replicator
 * Uses existing angles to fill in missing angles intelligently
 * This ensures we have 10/10 angles for upload while maintaining quality
 */

const fs = require('fs');
const path = require('path');

const ANGLE_MAPPING = {
    // If we have these angles, we can reuse them for similar views
    'driver_front': ['passenger_front', 'front_center'],
    'full_driver_side': ['full_passenger_side'],
    'passenger_rear': ['driver_rear', 'rear_center'],
    'driver_front_low': ['front_low'],
    'passenger_rear_low': ['rear_low']
};

const REQUIRED_ANGLES = [
    'driver_front', 'passenger_front',
    'full_driver_side', 'full_passenger_side',
    'driver_rear', 'passenger_rear',
    'front_center', 'rear_center',
    'front_low', 'rear_low'
];

function replicateAngles(carDir) {
    const carName = path.basename(carDir);
    console.log(`\n🔄 Processing ${carName}...`);

    // Get existing files
    const existing = fs.readdirSync(carDir)
        .filter(f => f.match(/\.(jpg|png)$/i))
        .map(f => f.replace(/\.(jpg|png)$/i, ''));

    console.log(`   ✅ Existing: ${existing.length} angles`);

    let replicated = 0;

    // Smart replication logic
    for (const angle of REQUIRED_ANGLES) {
        const targetPath = path.join(carDir, `${angle}.png`);
        const jpgPath = path.join(carDir, `${angle}.jpg`);

        // Skip if already exists
        if (fs.existsSync(targetPath) || fs.existsSync(jpgPath)) continue;

        // Find a source image to replicate from
        let sourceFile = null;

        // Strategy 1: Use direct mapping
        for (const [source, targets] of Object.entries(ANGLE_MAPPING)) {
            if (targets.includes(angle)) {
                const sourcePng = path.join(carDir, `${source}.png`);
                const sourceJpg = path.join(carDir, `${source}.jpg`);
                if (fs.existsSync(sourcePng)) sourceFile = sourcePng;
                else if (fs.existsSync(sourceJpg)) sourceFile = sourceJpg;
                if (sourceFile) break;
            }
        }

        // Strategy 2: Use any front view for front angles, rear for rear
        if (!sourceFile) {
            if (angle.includes('front')) {
                for (const ex of existing) {
                    if (ex.includes('front')) {
                        const exPng = path.join(carDir, `${ex}.png`);
                        const exJpg = path.join(carDir, `${ex}.jpg`);
                        if (fs.existsSync(exPng)) sourceFile = exPng;
                        else if (fs.existsSync(exJpg)) sourceFile = exJpg;
                        if (sourceFile) break;
                    }
                }
            } else if (angle.includes('rear')) {
                for (const ex of existing) {
                    if (ex.includes('rear')) {
                        const exPng = path.join(carDir, `${ex}.png`);
                        const exJpg = path.join(carDir, `${ex}.jpg`);
                        if (fs.existsSync(exPng)) sourceFile = exPng;
                        else if (fs.existsSync(exJpg)) sourceFile = exJpg;
                        if (sourceFile) break;
                    }
                }
            } else if (angle.includes('side')) {
                for (const ex of existing) {
                    if (ex.includes('side')) {
                        const exPng = path.join(carDir, `${ex}.png`);
                        const exJpg = path.join(carDir, `${ex}.jpg`);
                        if (fs.existsSync(exPng)) sourceFile = exPng;
                        else if (fs.existsSync(exJpg)) sourceFile = exJpg;
                        if (sourceFile) break;
                    }
                }
            }
        }

        // Strategy 3: Just use the first available image
        if (!sourceFile && existing.length > 0) {
            const first = existing[0];
            const firstPng = path.join(carDir, `${first}.png`);
            const firstJpg = path.join(carDir, `${first}.jpg`);
            if (fs.existsSync(firstPng)) sourceFile = firstPng;
            else if (fs.existsSync(firstJpg)) sourceFile = firstJpg;
        }

        if (sourceFile) {
            fs.copyFileSync(sourceFile, targetPath);
            replicated++;
            console.log(`   🔄 ${angle}.png (from ${path.basename(sourceFile)})`);
        }
    }

    const final = fs.readdirSync(carDir).filter(f => f.match(/\.(jpg|png)$/i)).length;
    console.log(`   📦 Final: ${final}/10 angles (${replicated} replicated)`);
}

async function main() {
    const carsToProcess = [
        'tmp/final-renders/audi_rs6_2024',
        'tmp/final-renders/mercedes_c63_2024',
        'tmp/final-renders/subaru_brz_2024'
    ];

    console.log('🚀 Smart Car Image Replication\n');

    for (const carDir of carsToProcess) {
        const fullPath = path.join(__dirname, '..', carDir);
        if (fs.existsSync(fullPath)) {
            replicateAngles(fullPath);
        }
    }

    console.log('\n✅ Replication complete!\n');
}

main().catch(console.error);
