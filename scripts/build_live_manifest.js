const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// --- CONFIGURATION ---
const SCAN_ROOTS = [
    'website/public/assets/cars',
    'website/dist/assets/cars',
    'tmp',
    'output',
    'production_renders',
    'renders_ai',
    'temp_assets'
];
const MANIFEST_OUT = 'output/provenance_manifest.json';

// Canonical Keys
const FOLDER_MAP = {
    'subaru_brz_blue': 'brz_stock_blue',
    'subaru_brz_stock': 'brz_stock_blue',
    'subaru_brz_2024': 'brz_stock_blue',

    'subaru_brz_custom': 'brz_custom_matte',
    'subaru_brz_grey': 'brz_custom_matte',
    'subaru_brz_matte': 'brz_custom_matte',
    'subaru_brz_matte_black': 'brz_custom_matte',
    'subaru_brz_2022_matte_black': 'brz_custom_matte',

    'audi_rs6_standard': 'rs6_stock_grey',
    'audi_rs6': 'rs6_stock_grey',
    'audi_rs6_2024_nardo_grey': 'rs6_stock_grey',

    'audi_rs6_custom': 'rs6_custom_blue',
    'audi_rs6_2024': 'rs6_custom_blue',

    'mercedes_c63': 'c63_stock_black',
    'mercedes_c63_stock': 'c63_stock_black',
    'mercedes_c63_2024': 'c63_stock_black',

    'bmw_m3_stock': 'm3_stock_white',
    'bmw_m3_2024': 'm3_stock_white',
    'bmw_m3': 'm3_stock_white',

    'bmw_m3_custom': 'm3_custom_red',
    'bmw_m3_2023_toronto_red': 'm3_custom_red',

    'porsche_gt3_stock': 'gt3_stock_red',
    'porsche_911_stock': 'gt3_stock_red',
    'porsche_911_2024': 'gt3_stock_red',

    'porsche_manthey': 'gt3_manthey_green',
    'porsche_911_manthey': 'gt3_manthey_green',
    'porsche_911_2024_army_green': 'gt3_manthey_green',
    'porsche_911_2024_green': 'gt3_manthey_green',

    'carrera4s_studio_base': 'carrera4s_studio_base',
    'demo_sandbox_car': 'demo_sandbox_car'
};

const CANONICAL_KEYS = [
    'brz_stock_blue', 'brz_custom_matte',
    'rs6_stock_grey', 'rs6_custom_blue',
    'c63_stock_black',
    'm3_stock_white', 'm3_custom_red',
    'gt3_stock_red', 'gt3_manthey_green',
    'carrera4s_studio_base', 'demo_sandbox_car'
];

function getFileHash(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('sha1');
        hashSum.update(buffer);
        return hashSum.digest('hex');
    } catch (e) { return null; }
}

function calculateScore(filename, fullPath, stats, hash, parentFolder) {
    let score = 0;
    let reasons = [];

    const lowerPath = fullPath.toLowerCase();
    const size = stats.size;
    const hasTimestamp = /_17\d{8,}/.test(filename);

    // 1. Located in Known Gemini Output Dirs (+3)
    if (lowerPath.includes('tmp/final-renders') ||
        lowerPath.includes('tmp/user_approved_renders') ||
        lowerPath.includes('output/tmp') ||
        lowerPath.includes('production_renders') ||
        lowerPath.includes('renders_ai')) {
        score += 3;
        reasons.push('DIR');
    }

    // USER OVERRIDE: Force Website Paths for Specific Models
    // "Gray BRZ in custom verification" -> website/public/assets/cars/subaru_brz_custom
    if (parentFolder === 'subaru_brz_custom' && lowerPath.includes('website/public')) {
        score += 10;
        reasons.push("USER_FORCED_WEBSITE");
    }
    // "M3 White on the website" -> website/public/assets/cars/bmw_m3
    if ((parentFolder === 'bmw_m3' || parentFolder === 'bmw_m3_stock') && lowerPath.includes('website/public')) {
        score += 10;
        reasons.push("USER_FORCED_WEBSITE");
    }

    // 2. Timestamp Token (+2)
    if (hasTimestamp) {
        score += 2;
        reasons.push('TS');
    }

    // 3. Size > 220KB (+1)
    if (size > 220 * 1024) {
        score += 1;
        reasons.push('SIZE');
    }

    // 4. Reference/Stock Penalty (-2)
    if (lowerPath.includes('stock-photos') || lowerPath.includes('references') || lowerPath.includes('web_assets')) {
        score -= 2;
        reasons.push('STOCK_DIR');
    }

    return { score, reasons };
}

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    try {
        const files = fs.readdirSync(dir);
        files.forEach(f => {
            const fullPath = path.join(dir, f);
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
                if (f !== 'node_modules' && !f.startsWith('.')) {
                    walkDir(fullPath, callback);
                }
            } else {
                callback(f, fullPath, stats, path.basename(dir));
            }
        });
    } catch (e) { }
}

// --- MAIN ---
const manifest = {};
CANONICAL_KEYS.forEach(k => {
    manifest[k] = {
        angles: {}
    };
    for (let i = 1; i <= 10; i++) {
        manifest[k].angles[`angle_${String(i).padStart(2, '0')}`] = {
            selected: null,
            candidates: []
        };
    }
});

const hashMap = {};

function scan() {
    console.log("Starting Comprehensive Provenance Scan...");
    const allCandidates = [];

    SCAN_ROOTS.forEach(root => {
        walkDir(root, (filename, fullPath, stats, parentFolder) => {
            if (!filename.endsWith('.png')) return;

            const canonical = FOLDER_MAP[parentFolder];
            if (!canonical) return;

            const hash = getFileHash(fullPath);
            if (!hash) return;

            hashMap[hash] = (hashMap[hash] || 0) + 1;

            const { score, reasons } = calculateScore(filename, fullPath, stats, hash, parentFolder);

            let angleSlot = null;
            const match = filename.match(/^angle_(\d+)/) || filename.match(/^(\d+)\.png$/);
            if (match) {
                const n = parseInt(match[1]);
                if (n >= 1 && n <= 10) angleSlot = `angle_${String(n).padStart(2, '0')}`;
            } else {
                if (filename.includes('driver_front')) angleSlot = 'angle_01';
                if (filename.includes('passenger_front')) angleSlot = 'angle_02';
                if (filename.includes('full_driver_side')) angleSlot = 'angle_03';
                if (filename.includes('full_passenger_side')) angleSlot = 'angle_04';
                if (filename.includes('driver_rear')) angleSlot = 'angle_05';
                if (filename.includes('passenger_rear')) angleSlot = 'angle_06';
                if (filename.includes('front_center') || filename.includes('front_ISO')) angleSlot = 'angle_07';
                if (filename.includes('rear_center') || filename.includes('rear_ISO')) angleSlot = 'angle_08';
                if (filename.includes('front_low')) angleSlot = 'angle_09';
                if (filename.includes('rear_low')) angleSlot = 'angle_10';
            }

            if (angleSlot) {
                allCandidates.push({
                    canonical,
                    angleSlot,
                    score,
                    reasons,
                    hash,
                    size: stats.size,
                    path: fullPath,
                    filename,
                    folder: parentFolder
                });
            }
        });
    });

    allCandidates.forEach(c => {
        if (hashMap[c.hash] > 10) {
            c.score -= 3;
            c.reasons.push('DUPLICATE_HASH');
        }

        const m = manifest[c.canonical];
        if (m) {
            m.angles[c.angleSlot].candidates.push(c);
        }
    });

    Object.keys(manifest).forEach(k => {
        const m = manifest[k];
        Object.keys(m.angles).forEach(angleKey => {
            const slot = m.angles[angleKey];
            slot.candidates.sort((a, b) => b.score - a.score);
            if (slot.candidates.length > 0) {
                slot.selected = slot.candidates[0];
            }
        });
    });

    fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
    console.log("Manifest written to " + MANIFEST_OUT);
}

scan();
