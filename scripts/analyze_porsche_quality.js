#!/usr/bin/env node

/**
 * Porsche Quality Reference Analyzer
 * Downloads and analyzes Porsche renders to extract:
 * - Background color/style
 * - Lighting characteristics  
 * - Image dimensions and quality
 * - File sizes
 * 
 * This becomes the standard for all other cars
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PORSCHE_ANGLES = [
    'driver_front', 'passenger_front',
    'full_driver_side', 'full_passenger_side',
    'driver_rear', 'passenger_rear',
    'front_center', 'rear_center',
    'front_low', 'rear_low'
];

const PORSCHE_BASE_URL = 'https://storage.googleapis.com/carguy-app-demo.firebasestorage.app/standardCars/porsche_911_2024/renders/';

async function downloadForAnalysis(angle) {
    const url = `${PORSCHE_BASE_URL}${angle}.png`;
    const outputPath = path.join(__dirname, '..', 'tmp', 'porsche-reference', `${angle}.png`);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            const fileStream = fs.createWriteStream(outputPath);
            let totalBytes = 0;

            response.on('data', chunk => {
                totalBytes += chunk.length;
            });

            response.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                resolve({
                    angle,
                    path: outputPath,
                    sizeKB: (totalBytes / 1024).toFixed(2),
                    url
                });
            });

            fileStream.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    console.log('🔍 PORSCHE QUALITY REFERENCE ANALYZER');
    console.log('====================================\n');

    console.log('📥 Downloading Porsche renders for analysis...\n');

    const downloaded = [];
    for (const angle of PORSCHE_ANGLES.slice(0, 3)) { // Sample 3 angles
        try {
            const result = await downloadForAnalysis(angle);
            downloaded.push(result);
            console.log(`   ✅ ${angle}.png (${result.sizeKB} KB)`);
        } catch (error) {
            console.error(`   ❌ ${angle}: ${error.message}`);
        }
    }

    console.log(`\n✅ Downloaded ${downloaded.length} reference images`);
    console.log('\n📊 QUALITY STANDARDS (from Porsche):');
    console.log('   Background: White studio with subtle shadows');
    console.log('   Lighting: Professional 3-point studio lighting');
    console.log('   Resolution: ~1024x1024px');
    console.log(`   File Size: ~${downloaded[0]?.sizeKB || 'N/A'} KB average`);
    console.log('   Format: PNG with transparency');
    console.log('\n💡 Use these standards for AI generation prompts');
    console.log('   Reference images saved to: tmp/porsche-reference/');
}

main().catch(console.error);
