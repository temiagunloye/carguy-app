#!/usr/bin/env node

/**
 * CLEANUP DUPLICATE/REPLICATED IMAGES
 * Removes low-quality replicated images, keeping only unique renders
 * Prepares for high-quality AI replacements
 */

const fs = require('fs');
const path = require('path');

const CARS = [
    'bmw_m3_2024',
    'subaru_brz_2024',
    'audi_rs6_2024',
    'mercedes_c63_2024'
];

const RENDERS_DIR = path.join(__dirname, '..', 'tmp', 'final-renders');

function analyzeImageQuality(filePath) {
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;

    // Heuristics for quality:
    // - Replicated images are often smaller (lazy copies)
    // - AI-generated should be ~400-500KB like Porsche
    // - JPGs were user uploads (keep), PNGs were replicas (review)

    const isJPG = filePath.endsWith('.jpg');
    const isPNG = filePath.endsWith('.png');
    const isHighQuality = sizeKB > 300; // Porsche averages ~415KB

    return {
        path: filePath,
        sizeKB: sizeKB.toFixed(2),
        isJPG,
        isPNG,
        isHighQuality,
        isLikelyReplica: isPNG && !isHighQuality
    };
}

function cleanupCar(carId) {
    const carDir = path.join(RENDERS_DIR, carId);

    if (!fs.existsSync(carDir)) {
        console.log(`⏭️  ${carId}: Directory not found`);
        return;
    }

    console.log(`\n📁 ${carId}`);

    const files = fs.readdirSync(carDir)
        .filter(f => f.match(/\.(jpg|png)$/i))
        .map(f => path.join(carDir, f));

    if (files.length === 0) {
        console.log(`   ⚠️  No images found`);
        return;
    }

    // Analyze all files
    const analyzed = files.map(analyzeImageQuality);

    // Show analysis
    console.log(`   Total files: ${analyzed.length}`);
    const replicas = analyzed.filter(a => a.isLikelyReplica);
    const highQuality = analyzed.filter(a => a.isHighQuality);

    console.log(` ✅ High quality: ${highQuality.length}`);
    console.log(`   🔄 Likely replicas: ${replicas.length}`);

    // List replicas for review
    if (replicas.length > 0) {
        console.log(`\n   Replica candidates:`);
        replicas.forEach(r => {
            console.log(`     - ${path.basename(r.path)} (${r.sizeKB} KB)`);
        });
    }

    // Keep originals for now - will be replaced by AI generation
    console.log(`\n   📝 Action: Keep for now, AI will replace with high-quality`);
}

function main() {
    console.log('🧹 CLEANUP DUPLICATE/REPLICATED IMAGES');
    console.log('======================================\n');

    console.log('Strategy: Identify low-quality replicas, prepare for AI replacement\n');

    for (const carId of CARS) {
        cleanupCar(carId);
    }

    console.log('\n✅ Analysis complete');
    console.log('\n💡 Next Steps:');
    console.log('   1. Wait for AI generation to complete (~1h)');
    console.log('   2. AI will create 10 unique high-quality renders per car');
    console.log('   3. Old replicas will be overwritten automatically');
    console.log('   4. Final deployment will use only AI-generated renders');
}

main();
