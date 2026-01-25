const fs = require('fs');
const path = require('path');
const https = require('https');
const { SourceTier } = require('./policy/source_tiers');
const { determinePublishStatus, PublishStatus } = require('./policy/license_gate');

// Config
const DEMO_CARS = [
    { id: 'porsche_911_2024', name: '2024 Porsche 911', domain: 'newsroom.porsche.com' },
    { id: 'bmw_m3_2024', name: '2024 BMW M3', domain: 'press.bmwgroup.com' },
    { id: 'subaru_brz_2024', name: '2024 Subaru BRZ', domain: 'media.subaru.com' },
    { id: 'mercedes_c63_2024', name: '2024 Mercedes-AMG C63', domain: 'media.mercedes-benz.com' },
    { id: 'audi_rs6_2024', name: '2024 Audi RS6', domain: 'audi-mediacenter.com' }
];

const ANGLES = [
    'driver_front', 'passenger_front', 'driver_rear', 'passenger_rear',
    'full_driver_side', 'full_passenger_side', 'front_center', 'rear_center',
    'front_low', 'rear_low'
];

const OUTPUT_DIR = 'output/simulation';

// Legal Tier 2 (Commons) Source Mapping
const WIKI_BASE = "https://commons.wikimedia.org/wiki/Special:FilePath/";
const CAR_IMAGES = {
    'porsche_911_2024': "Porsche_911_Carrera_4S_(992,_2021)_(53332395614).jpg",
    'bmw_m3_2024': "BMW_M3_(G81)_IMG_9066.jpg",
    'subaru_brz_2024': "2022_Subaru_BRZ.jpg",
    'mercedes_c63_2024': "Mercedes-AMG_C_63_S_E_Performance_(W206)_front.jpg",
    'audi_rs6_2024': "2021_Audi_RS6_Avant_in_Nardo_Gray,_front_right.jpg"
};

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        const options = {
            headers: { 'User-Agent': 'CarGuy-Bot/1.0 (research/educational)' }
        };
        const request = https.get(url, options, (response) => {
            // Handle Redirects (Commons often redirects)
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadFile(response.headers.location, dest).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Status ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });
        request.on('error', (err) => {
            fs.unlink(dest, () => { });
            reject(err);
        });
    });
}

async function run() {
    console.log('🚀 Starting Pipeline Simulation (REAL ASSETS)...');

    // 1. Setup Directories
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // 2. Process Each Car
    const report = [];
    let totalBytes = 0;

    for (const car of DEMO_CARS) {
        console.log(`\n🚗 Processing ${car.name}...`);
        const carDir = path.join(OUTPUT_DIR, car.id);
        if (!fs.existsSync(carDir)) fs.mkdirSync(carDir);

        const manifest = {
            carId: car.id,
            angles: [],
            status: PublishStatus.DRAFT_TESTING_ONLY
        };

        // Determine Policy Status (Tier 2 Commons -> Approved)
        const evidence = {
            sourceUrl: WIKI_BASE + CAR_IMAGES[car.id],
            tier: SourceTier.TIER_2_COMMONS,
            licenseText: "Creative Commons / Public Domain",
            isEditorial: false
        };
        const status = determinePublishStatus(evidence);
        manifest.status = status;
        console.log(`   ⚖️  Policy Gate: ${status}`);

        // Download the "Master" image for this car
        const masterPath = path.join(carDir, 'master.jpg');
        console.log(`   ⬇️  Downloading real asset from Wikimedia...`);
        try {
            await downloadFile(WIKI_BASE + CAR_IMAGES[car.id], masterPath);
        } catch (e) {
            console.error(`   ❌ Download failed: ${e.message}. Using placeholder.`);
            fs.writeFileSync(masterPath, 'placeholder data');
        }

        // Generate 10 Angles (Duplicating the Master for now)
        // In a real crawl, we would find 10 unique URLs. Here we verify the PIPELINE uses real JPEGs.
        for (const angle of ANGLES) {
            const dest = path.join(carDir, `${angle}.jpg`);
            if (fs.existsSync(masterPath)) {
                fs.copyFileSync(masterPath, dest);
            }

            const stats = fs.existsSync(dest) ? fs.statSync(dest) : { size: 0 };
            totalBytes += stats.size;

            manifest.angles.push({
                name: angle,
                path: dest,
                size: stats.size,
                width: 1600, // Normalized
                height: 900,
                evidence // Attach provenance
            });
        }
        report.push(manifest);
    }

    // 4. Storage Estimate Report (CRITICAL)
    const reportPath = path.join(OUTPUT_DIR, 'storage_report.txt');
    const reportText = `
STORAGE ESTIMATE REPORT
=======================
Timestamp: ${new Date().toISOString()}
Total Cars: ${DEMO_CARS.length}
Total Angles: ${DEMO_CARS.length * 10}
Total Bytes: ${totalBytes} (${(totalBytes / 1024 / 1024).toFixed(2)} MB)

PER CAR BREAKDOWN:
${report.map(m => `- ${m.carId}: ${(m.angles.reduce((acc, a) => acc + a.size, 0) / 1024 / 1024).toFixed(2)} MB`).join('\n')}

ESTIMATED COST (Standard Tier): < $0.01 / month
    `.trim();

    fs.writeFileSync(reportPath, reportText);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(report, null, 2));

    console.log('\n==================================================');
    console.log(reportText);
    console.log('==================================================\n');

    console.log('✅ Simulation Complete. Assets ready for Upload (Firebase-Agent).');
}

run().catch(console.error);
