#!/usr/bin/env node

/**
 * Car Render Downloader
 * Downloads official press photos for car models from manufacturer websites
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// High-quality car photo sources
const CAR_PHOTO_SOURCES = {
    bmw_m3_2024: [
        // BMW press photos (high quality, white background)
        'https://www.bmwusa.com/content/dam/bmwusa/MY24/M3_Sedan/Studio/BMW-M3-Sedan-E001-2024.jpg',
        'https://www.bmwusa.com/content/dam/bmwusa/MY24/M3_Sedan/Studio/BMW-M3-Sedan-E002-2024.jpg',
        'https://www.bmwusa.com/content/dam/bmwusa/MY24/M3_Sedan/Studio/BMW-M3-Sedan-E003-2024.jpg'
    ],
    audi_rs6_2024: [
        'https://www.audiusa.com/content/dam/nemo/us/models/rs/rs6-avant/MY24/1920x1080/2024-audi-rs6-avant-1920x1080-01.jpg',
        'https://www.audiusa.com/content/dam/nemo/us/models/rs/rs6-avant/MY24/1920x1080/2024-audi-rs6-avant-1920x1080-02.jpg'
    ],
    mercedes_c63_2024: [
        'https://www.mbusa.com/content/dam/mb-nafta/us/myco/my24/c-class/amg-sedan/gallery/2024-AMG-C63-S-E-PERFORMANCE-SEDAN-GAL-001-FE-DR.jpg'
    ],
    subaru_brz_2024: [
        'https://www.subaru.com/content/dam/subaru/vehicles/2024/brz/vlp/exterior/2024-BRZ-Premium-Ice-Silver-Metallic-Front-34-Desktop.jpg'
    ]
};

async function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        protocol.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                // Follow redirect
                return downloadImage(response.headers.location, outputPath)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve(outputPath);
            });

            fileStream.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    console.log('🚗 Downloading official car photos...\n');

    const outputBase = path.join(__dirname, '../../tmp/car-renders');

    for (const [carId, urls] of Object.entries(CAR_PHOTO_SOURCES)) {
        const carDir = path.join(outputBase, carId);
        fs.mkdirSync(carDir, { recursive: true });

        console.log(`\n📦 ${carId}:`);

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];
            const ext = path.extname(new URL(url).pathname) || '.jpg';
            const outputPath = path.join(carDir, `angle_${i}${ext}`);

            try {
                console.log(`   ⬇️  Downloading ${i + 1}/${urls.length}...`);
                await downloadImage(url, outputPath);
                console.log(`      ✓ Saved to ${outputPath}`);
            } catch (error) {
                console.error(`      ❌ Failed: ${error.message}`);
            }
        }
    }

    console.log('\n✅ Download complete!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { downloadImage };
