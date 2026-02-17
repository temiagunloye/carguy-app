const fs = require('fs');
const path = require('path');

// --- CONFIGURATION ---
const SEARCH_DIRS = [
    'tmp',
    'output',
    'temp_assets',
    'production_renders',
    'renders_ai',
    'website/public' // Added for BRZ Custom check (with strict filter)
];

// Models to find (keywords associated with them)
const MODELS = {
    'subaru_brz_blue': { keywords: ['subaru', 'brz', 'blue', '2024'], name: 'Subaru BRZ Stock (Blue)' },
    'subaru_brz_custom': { keywords: ['subaru', 'brz', 'matte', 'coal'], name: 'Subaru BRZ Custom (Matte)' },
    'mercedes_c63_stock': { keywords: ['mercedes', 'c63', 'stock', 'black'], name: 'Mercedes C63 Stock (Black)' },
    'bmw_m3_stock': { keywords: ['bmw', 'm3', 'white', 'stock'], name: 'BMW M3 Stock (White)' },
    'bmw_m3_custom': { keywords: ['bmw', 'm3', 'red', 'toronto'], name: 'BMW M3 Custom (Red)' },
    'audi_rs6_stock': { keywords: ['audi', 'rs6', 'grey', 'nardo'], name: 'Audi RS6 Stock (Grey)' },
    'audi_rs6_custom': { keywords: ['audi', 'rs6', 'blue', 'ultra'], name: 'Audi RS6 Custom (Blue)' },
    'porsche_gt3_stock': { keywords: ['porsche', '911', 'stock', 'red'], name: 'Porsche 911 GT3 Stock (Red)' },
    'porsche_manthey': { keywords: ['porsche', 'manthey', 'green'], name: 'Porsche Manthey (Green)' }
};

// Semantic to Angle Mapping (Standardized)
const SEMANTIC_MAP = {
    'driver_front': 'angle_01',
    'passenger_front': 'angle_02',
    'full_driver_side': 'angle_03',
    'full_passenger_side': 'angle_04',
    'driver_rear': 'angle_05',
    'passenger_rear': 'angle_06',
    'front_center': 'angle_07',
    'rear_center': 'angle_08',
    'front_low': 'angle_09',
    'rear_low': 'angle_10',
    // Fallback for simple names
    'angle_1': 'angle_01', 'angle_2': 'angle_02', 'angle_3': 'angle_03', 'angle_4': 'angle_04',
    'angle_5': 'angle_05', 'angle_6': 'angle_06', 'angle_7': 'angle_07', 'angle_8': 'angle_08',
    'angle_9': 'angle_09'
};

const MANIFEST_OUT = 'output/approval_manifest.json';

// --- UTILS ---

function isGeminiCandidate(filename, fullPath) {
    const lowerPath = fullPath.toLowerCase();

    // 1. Must use timestamp pattern (strongest indicator)
    if (/_17\d{8,}/.test(filename)) return true;

    // 2. Explicit inclusion of User Approved/Verified paths
    if (lowerPath.includes('user_approved_renders/custom_builds/')) return true;

    // 3. Exception for BRZ Custom in website/public IF we trust it
    // User said "BRZ Custom is Ready". 
    // Path: website/public/assets/cars/subaru_brz_custom
    if (lowerPath.includes('website/public/assets/cars/subaru_brz_custom')) return true;

    return false;
}

function identifyModel(filename, fullPath) {
    const lowerPath = fullPath.toLowerCase();

    // Specific Path Matching Rules (Stronger than fuzzy keywords)
    if (lowerPath.includes('subaru_brz_2024')) return 'subaru_brz_blue';
    if (lowerPath.includes('subaru_brz_matte') || lowerPath.includes('subaru_brz_custom')) return 'subaru_brz_custom';

    if (lowerPath.includes('mercedes_c63')) return 'mercedes_c63_stock';

    // RS6 Disambiguation
    if (lowerPath.includes('audi_rs6_2024_nardo')) return 'audi_rs6_stock';
    // Generic folder often holds the custom one, or explicit custom folder
    if (lowerPath.includes('audi_rs6_2024') && !lowerPath.includes('nardo')) return 'audi_rs6_custom';

    // M3 Disambiguation
    if (lowerPath.includes('bmw_m3_2024')) return 'bmw_m3_stock';
    if (lowerPath.includes('bmw_m3_2023') || lowerPath.includes('toronto')) return 'bmw_m3_custom';

    // Porsche Disambiguation
    if (lowerPath.includes('manthey')) return 'porsche_manthey';
    if (lowerPath.includes('porsche_911_2024') && !lowerPath.includes('manthey')) return 'porsche_gt3_stock';

    return null;
}

function identifyAngle(filename) {
    const lower = filename.toLowerCase();

    // 1. Explicit angle_XX
    const m = lower.match(/angle_(\d+)/);
    if (m) return `angle_${m[1].padStart(2, '0')}`;

    // 2. Semantic
    for (const [semantic, angle] of Object.entries(SEMANTIC_MAP)) {
        if (lower.includes(semantic)) return angle;
    }

    return null;
}

// --- MAIN ---

const args = process.argv.slice(2);
const manifest = { models: {} };

// Initialize Manifest placeholders
Object.keys(MODELS).forEach(k => {
    manifest.models[k] = {
        name: MODELS[k].name,
        angles: {},
        missing: [],
        confidence: 'none'
    };
});

function scanDir(dir) {
    if (!fs.existsSync(dir)) return;

    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (item === 'node_modules' || item.startsWith('.')) continue;
            // Recursion
            scanDir(fullPath);
        } else {
            // Check File
            if (!item.endsWith('.png') && !item.endsWith('.webp')) continue;

            if (isGeminiCandidate(item, fullPath)) {
                const modelKey = identifyModel(item, fullPath);
                if (!modelKey) continue;

                const angleKey = identifyAngle(item);
                if (!angleKey) continue;

                const existing = manifest.models[modelKey].angles[angleKey];
                const fileTimestamp = parseInt((item.match(/_17\d{8,}/) || ['0'])[0].replace('_', '')) || stat.mtimeMs;

                // Keep NEWEST file
                if (!existing || fileTimestamp > existing.timestamp) {
                    manifest.models[modelKey].angles[angleKey] = {
                        path: fullPath,
                        filename: item,
                        size: stat.size,
                        mtime: stat.mtime,
                        timestamp: fileTimestamp
                    };
                }
            }
        }
    }
}

// 1. Run Scan
console.log("🔍 Scanning for Gemini Renders...");
SEARCH_DIRS.forEach(d => scanDir(d));

// 2. Analyze & Fill Missing
console.log("📊 Analyzing results...");
Object.keys(manifest.models).forEach(key => {
    const m = manifest.models[key];
    const foundAngles = Object.keys(m.angles);

    // Check 01-10
    const missing = [];
    for (let i = 1; i <= 10; i++) {
        const k = `angle_${String(i).padStart(2, '0')}`;
        if (!m.angles[k]) missing.push(k);
    }
    m.missing = missing;

    // Confidence Logic
    if (foundAngles.length >= 10) m.confidence = 'high';
    else if (foundAngles.length > 0) m.confidence = 'partial';
    else m.confidence = 'missing';

    console.log(`  > ${m.name}: Found ${foundAngles.length}/10 (${m.confidence.toUpperCase()})`);
});

// 3. Write Manifest
if (!fs.existsSync('output')) fs.mkdirSync('output');
fs.writeFileSync(MANIFEST_OUT, JSON.stringify(manifest, null, 2));
console.log(`\n✅ Manifest written to ${MANIFEST_OUT}`);
