const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
// STRICTLY LIVE ASSETS FIRST
const LIVE_ROOT = 'website/public/assets/cars';
const FIREBASE_EMULATOR_ROOT = 'website/dist/assets/cars'; // Check if dist mirrors public

// Models to find
const TARGET_MODELS = [
    'subaru_brz_blue',
    'subaru_brz_custom',
    'mercedes_c63',
    'mercedes_c63_stock', // might be alias
    'bmw_m3_stock',
    'bmw_m3_custom',
    'audi_rs6_standard',
    'audi_rs6_custom',
    'porsche_manthey',
    'porsche_gt3_stock',
    // Check for other folder names seen in ls
    'bmw_m3', // generic might be stock
    'audi_rs6',
    'subaru_brz_grey'
];

const MANIFEST_OUT = 'output/live_manifest.json';

function getFolderSize(dirPath) {
    // simplified
    return 0;
}

function scanLiveAssets() {
    const manifest = { models: {} };

    // 1. Scan website/public/assets/cars
    if (fs.existsSync(LIVE_ROOT)) {
        const folders = fs.readdirSync(LIVE_ROOT);

        folders.forEach(folder => {
            const fullPath = path.join(LIVE_ROOT, folder);
            if (!fs.statSync(fullPath).isDirectory()) return;

            // Check for images
            const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.png'));

            manifest.models[folder] = {
                source: 'website/public',
                path: fullPath,
                angles: files,
                count: files.length,
                isGeminiLikely: false // Todo: check file size or headers?
            };

            // Heuristic: Real renders are usually larger than placeholders (placeholders often < 50KB or same size)
            // Let's check sizes of first file
            if (files.length > 0) {
                const s = fs.statSync(path.join(fullPath, files[0]));
                manifest.models[folder].sampleSize = s.size;
            }
        });
    }

    // 2. Scan Dist (sometimes has different build artifacts)
    if (fs.existsSync(FIREBASE_EMULATOR_ROOT)) {
        const folders = fs.readdirSync(FIREBASE_EMULATOR_ROOT);
        folders.forEach(folder => {
            // overlap check
            if (!manifest.models[folder]) {
                const fullPath = path.join(FIREBASE_EMULATOR_ROOT, folder);
                if (fs.statSync(fullPath).isDirectory()) {
                    const files = fs.readdirSync(fullPath).filter(f => f.endsWith('.png'));
                    manifest.models[folder] = {
                        source: 'website/dist',
                        path: fullPath,
                        angles: files,
                        count: files.length,
                        sampleSize: files.length > 0 ? fs.statSync(path.join(fullPath, files[0])).size : 0
                    };
                }
            }
        });
    }

    console.log("LIVE INVENTORY:");
    Object.keys(manifest.models).forEach(k => {
        const m = manifest.models[k];
        console.log(`  [${k}] -> ${m.count} angles (Size: ${m.sampleSize}) Source: ${m.source}`);
    });

    fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
    console.log(`\nWritten to ${MANIFEST_OUT}`);
}

scanLiveAssets();
