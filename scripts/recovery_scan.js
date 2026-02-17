const fs = require('fs');
const path = require('path');

// Configuration for the 9 models
const MODELS = [
    {
        id: 'subaru_brz_blue', // Destination folder name
        name: 'Subaru BRZ Stock (Blue)',
        sources: [
            'tmp/final-renders/subaru_brz_2024',
            'output/tmp 2/final-renders/subaru_brz_2024'
        ],
        // Logic: 10 angles. Source might implement semantic names.
        // We want to map semantic -> angle_XX
    },
    {
        id: 'mercedes_c63',
        name: 'Mercedes C63 Stock (Black)',
        sources: [
            'tmp/recovery/tmp/final-renders/mercedes_c63_2024',
            'tmp/user_approved_renders/tmp/final-renders/mercedes_c63_2024',
            'output/tmp 2/final-renders/mercedes_c63_2024',
            'tmp/final-renders/mercedes_c63_2024'
        ],
    },
    {
        id: 'subaru_brz_custom',
        name: 'Subaru BRZ Custom (Matte)',
        sources: ['website/public/assets/cars/subaru_brz_custom', 'tmp/user_approved_renders/custom_builds/subaru_brz_matte_coal'],
    },
    {
        id: 'bmw_m3_stock',
        name: 'BMW M3 Stock (White)',
        sources: [
            'tmp/recovery/tmp/final-renders/bmw_m3_2024',
            'tmp/final-renders/bmw_m3_2024'
        ],
    },
    {
        id: 'audi_rs6_standard', // Check destination name in visualizer-v2
        name: 'Audi RS6 Stock (Grey)',
        sources: [
            'tmp/recovery/tmp/final-renders/audi_rs6_2024_nardo_grey',
            'tmp/final-renders/audi_rs6_2024_nardo_grey'
        ],
    },
    {
        id: 'porsche_911_stock', // Usually maps to Manthey in V2, but let's check standard
        name: 'Porsche 911 GT3 Stock (Red)',
        sources: [
            'tmp/recovery/tmp/final-renders/porsche_911_2024',
            'tmp/user_approved_renders/tmp/final-renders/porsche_911_2024',
            'output/tmp 2/final-renders/porsche_911_2024',
            'tmp/final-renders/porsche_911_2024'
        ],
    },
    {
        id: 'porsche_manthey',
        name: 'Porsche Manthey (Green)',
        sources: [
            'tmp/recovery/tmp/final-renders/porsche_911_manthey',
            'tmp/user_approved_renders/tmp/final-renders/porsche_911_manthey',
            'output/tmp 4/production_staging/porsche_911_manthey',
            'tmp/final-renders/porsche_911_manthey'
        ],
    },
    {
        id: 'bmw_m3_custom',
        name: 'BMW M3 Custom (Red)',
        sources: ['tmp/final-renders/bmw_m3_2023_toronto_red'],
    },
    {
        id: 'audi_rs6_custom',
        name: 'Audi RS6 Custom (Blue)',
        sources: ['output/tmp 2/final-renders/audi_rs6_2024', 'tmp/final-renders/audi_rs6_2024'],
    }
];

// Mapping Semantic parts to Angle Index (1-10)
const ANGLE_MAPPING = {
    'driver_front': 1,
    'passenger_front': 2,
    'driver_rear': 3, // NOTE: Standard ordering might differ, checking visualizer usually 3=full side? 
    // Wait, visualizer-v2.js for BRZ Blue (lines 163-172) says:
    // 01: driver_front
    // 02: passenger_front
    // 03: full_driver_side
    // 04: full_passenger_side
    // 05: driver_rear
    // 06: passenger_rear
    // 07: front_center
    // 08: rear_center
    // 09: front_low
    // 10: rear_low

    // BUT C63 (lines 130+) simply uses angle_01..10. 
    // Let's stick to a VISUAL ORDER that makes sense for the spinner.
    // Standard Spin Order:
    // 1. driver_front
    // 2. passenger_front
    // 3. passenger_rear
    // 4. driver_rear
    // ... wait, usually it's a circle.

    // Let's look at the filenames found in previous steps to see what we have.
    // The timestamped files had names like: `subaru_brz_driver_front_1769...png`.

    // We will standardize on the BRZ Semantic -> Angle mapping defined above? 
    // NO, let's use the mapping implied by the timestamp filenames if possible, OR just search for the specific semantic token.

    'driver_front': 'angle_01',
    'passenger_front': 'angle_02',
    'full_driver_side': 'angle_03', // Mapping to Spin order? OR just keeping indices?
    'full_passenger_side': 'angle_04', // The V2 code for BRZ Blue had side at 03/04.
    'driver_rear': 'angle_05',
    'passenger_rear': 'angle_06',
    'front_center': 'angle_07',
    'rear_center': 'angle_08',
    'front_low': 'angle_09',
    'rear_low': 'angle_10'
};

// Alternate basic mapping (if files are just angle_01 etc)
// We just copy them.

function run() {
    console.log("Starting Recovery Scan...");

    MODELS.forEach(model => {
        console.log(`\n--------------------------------------------`);
        console.log(`Processing: ${model.name}`);
        let foundFiles = [];

        // 1. Scan sources
        for (const src of model.sources) {
            if (!fs.existsSync(src)) continue;

            const files = fs.readdirSync(src);
            console.log(`  Scanning ${src}... (${files.length} files)`);

            // Filter: Must be PNG.
            // Preference: Timestamped Gemini Render > Non-timestamped angle_xx.

            files.forEach(f => {
                if (!f.endsWith('.png')) return;

                // Check if it's a timestamped file (contains 176... or 177...)
                // Regex for timestamp: _17\d{8,}
                const isGemini = /_17\d{8,}/.test(f);

                // Identify Angle
                let angleName = null;

                // Match Semantic
                for (const [semantic, target] of Object.entries(ANGLE_MAPPING)) {
                    if (f.includes(semantic)) {
                        angleName = target;
                        break;
                    }
                }

                // Match "angle_XX"
                if (!angleName) {
                    const m = f.match(/angle_(\d+)/i);
                    if (m) {
                        angleName = `angle_${m[1].padStart(2, '0')}`;
                    }
                }

                if (angleName) {
                    foundFiles.push({
                        path: path.join(src, f),
                        file: f,
                        angle: angleName,
                        isGemini: isGemini,
                        timestamp: isGemini ? parseInt(f.match(/_17\d{8,}/)[0].substring(1)) : 0
                    });
                }
            });
        }

        // 2. Select Best Candidate per Angle
        const bestSet = {}; // angle_01 -> fileObj

        foundFiles.forEach(f => {
            const current = bestSet[f.angle];
            if (!current) {
                bestSet[f.angle] = f;
            } else {
                // Priority Logic:
                // 1. Gemini Timestamped preferred over non-timestamped
                // 2. Newer timestamp preferred

                if (f.isGemini && !current.isGemini) {
                    bestSet[f.angle] = f;
                } else if (f.isGemini && current.isGemini) {
                    if (f.timestamp > current.timestamp) {
                        bestSet[f.angle] = f;
                    }
                }
            }
        });

        // 3. Execute Copy
        const destDir = `website/public/assets/cars/${model.id}`;
        if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

        console.log(`  Target Directory: ${destDir}`);
        let count = 0;

        // Ensure we cover 01-10
        // NOTE: The mapping above set angle_03 to full_driver side for BRZ Blue. 
        // We need to match what existing models use or standardize.
        // Most models use angle_01...10 mapped to specific views.
        // We will write standardized angle_01.png...angle_10.png

        Object.keys(bestSet).sort().forEach(angle => {
            const candidate = bestSet[angle];
            const destPath = path.join(destDir, `${angle}.png`);

            fs.copyFileSync(candidate.path, destPath);
            console.log(`    ✅ ${angle} <- ${candidate.file} (${candidate.isGemini ? 'Gemini' : 'Static'})`);
            count++;
        });

        if (count < 10) {
            console.warn(`    ⚠️  WARNING: Only found ${count}/10 angles!`);
        }
    });

    console.log("\nDone.");
}

run();
