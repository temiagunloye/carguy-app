#!/usr/bin/env node

/**
 * CONTINUATION SCRIPT - Run after quota reset (2:45 PM)
 * 
 * Generates remaining car renders:
 * - Subaru BRZ: 3 remaining angles (rear_center, front_low, rear_low)
 * - Audi RS6: 10 angles (all new)
 * - Mercedes C63: 10 angles (all new)
 * 
 * Total: 23 images to generate
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/Users/temiagunloye/.gemini/antigravity/brain/88ff0a07-0d5d-42c6-b10e-3ca7bc9fc818';

// Initialize Firebase
const projectId = process.env.FIREBASE_PROJECT_ID || "carguy-app-demo";
if (admin.apps.length === 0) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(require("../serviceAccountKey.json")),
            storageBucket: `${projectId}.firebasestorage.app`
        });
    } catch (e) {
        admin.initializeApp({ projectId, storageBucket: `${projectId}.appspot.com` });
    }
}

const bucket = admin.storage().bucket();
const db = admin.firestore();

// Prompts for remaining images
const REMAINING_PROMPTS = {
    // Subaru BRZ (3 remaining)
    'subaru_brz_2022': {
        color: 'WR Blue Pearl',
        background: 'white seamless studio',
        lighting: 'professional 3-point automotive',
        style: 'sports coupe',
        angles: {
            'rear_center': 'straight rear center view (180 degree angle)',
            'front_low': 'dramatic low angle front view',
            'rear_low': 'dramatic low angle rear view'
        }
    },

    // Audi RS6 (10 angles)
    'audi_rs6_2024': {
        color: 'Daytona Grey Pearl',
        background: 'neutral gradient studio',
        lighting: 'dramatic cinematic with rim lights',
        style: 'performance wagon',
        angles: {
            'driver_front': 'driver front three-quarter view (315 degree angle)',
            'passenger_front': 'passenger front three-quarter view (45 degree angle)',
            'full_driver_side': 'full driver side profile view (270 degree angle)',
            'full_passenger_side': 'full passenger side profile view (90 degree angle)',
            'driver_rear': 'driver rear three-quarter view (225 degree angle)',
            'passenger_rear': 'passenger rear three-quarter view (135 degree angle)',
            'front_center': 'straight front center view (0 degree angle)',
            'rear_center': 'straight rear center view (180 degree angle)',
            'front_low': 'dramatic low angle front view',
            'rear_low': 'dramatic low angle rear view'
        }
    },

    // Mercedes C63 (10 angles)
    'mercedes_c63_2024': {
        color: 'Obsidian Black Metallic',
        background: 'dark gradient gray studio',
        lighting: 'dramatic cinematic',
        style: 'AMG Panamericana grille, quad exhaust',
        angles: {
            'driver_front': 'driver front three-quarter view (315 degree angle)',
            'passenger_front': 'passenger front three-quarter view (45 degree angle)',
            'full_driver_side': 'full driver side profile view (270 degree angle)',
            'full_passenger_side': 'full passenger side profile view (90 degree angle)',
            'driver_rear': 'driver rear three-quarter view (225 degree angle)',
            'passenger_rear': 'passenger rear three-quarter view (135 degree angle)',
            'front_center': 'straight front center view (0 degree angle), showing AMG grille',
            'rear_center': 'straight rear center view (180 degree angle), showing quad exhaust',
            'front_low': 'dramatic low angle front view, heroic perspective',
            'rear_low': 'dramatic low angle rear view, showing quad exhaust, heroic perspective'
        }
    }
};

function buildPrompt(carInfo, angleDesc) {
    const { color, background, lighting, style } = carInfo;
    return `2024 ${carInfo.model} in ${color}, professional automotive photography, ${angleDesc}, ${background} background, ${lighting}, ultra-sharp details, photorealistic, studio quality, subtle floor shadows, premium car photography${style ? ', ' + style : ''}`;
}

async function uploadCarImages(carId, generatedFiles) {
    console.log(`\n📤 Uploading ${carId} to Firebase...`);

    const photoAnglesHttp = {};
    const photoAngles = {};
    let uploadedCount = 0;

    for (const [angle, filename] of Object.entries(generatedFiles)) {
        const localFile = path.join(ARTIFACT_DIR, filename);

        if (!fs.existsSync(localFile)) {
            console.log(`   ⚠️  ${filename} not found, skipping`);
            continue;
        }

        try {
            const destination = `standardCars/${carId}/renders/${angle}.png`;
            await bucket.upload(localFile, {
                destination,
                metadata: {
                    contentType: 'image/png',
                    cacheControl: 'public, max-age=31536000'
                }
            });

            const file = bucket.file(destination);
            await file.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
            photoAnglesHttp[angle] = publicUrl;
            photoAngles[angle] = `gs://${bucket.name}/${destination}`;

            uploadedCount++;
            console.log(`   ✅ ${angle}.png → Storage`);
        } catch (error) {
            console.error(`   ❌ ${angle}: ${error.message}`);
        }
    }

    // Update Firestore (merge with existing data)
    await db.collection('standardCars').doc(carId).set({
        photoAnglesHttp,
        photoAngles,
        renderSource: 'gemini_ai_generated',
        renderQuality: 'professional_studio',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`   📦 Firestore updated (${uploadedCount} angles)`);
    return uploadedCount;
}

async function main() {
    console.log('🎨 CAR RENDER GENERATION - CONTINUATION SCRIPT');
    console.log('='.repeat(60));
    console.log('\n⚠️  MANUAL STEPS REQUIRED:\n');
    console.log('This script requires you to manually generate images using Gemini.');
    console.log('After quota resets (2:45 PM), use the following prompts:\n');
    console.log('='.repeat(60));

    let promptNum = 1;
    const totalImages = Object.values(REMAINING_PROMPTS).reduce((sum, car) => sum + Object.keys(car.angles).length, 0);

    for (const [carId, carInfo] of Object.entries(REMAINING_PROMPTS)) {
        console.log(`\n🚗 ${carId.toUpperCase()}`);
        console.log('-'.repeat(60));

        for (const [angle, angleDesc] of Object.entries(carInfo.angles)) {
            const prompt = buildPrompt(carInfo, angleDesc);
            console.log(`\n${promptNum}/${totalImages}) ${angle}:`);
            console.log(`   ${prompt}`);
            promptNum++;
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📝 AFTER GENERATION:');
    console.log('='.repeat(60));
    console.log('\n1. Generate all images above using Gemini');
    console.log('2. Note the generated filenames (they will be timestamped)');
    console.log('3. Update the GENERATED_FILES mapping below with actual filenames');
    console.log('4. Run this script again to upload to Firebase\n');
    console.log('Or if you prefer, use the existing upload_ai_renders.js script');
    console.log('and add the new file mappings there.\n');

    // Example structure for when images are generated:
    console.log('Example file mapping structure:');
    console.log(`
const GENERATED_FILES = {
    'subaru_brz_2022': {
        'rear_center': 'subaru_brz_rear_center_<TIMESTAMP>.png',
        'front_low': 'subaru_brz_front_low_<TIMESTAMP>.png',
        'rear_low': 'subaru_brz_rear_low_<TIMESTAMP>.png'
    },
    'audi_rs6_2024': {
        'driver_front': 'audi_rs6_driver_front_<TIMESTAMP>.png',
        // ... etc
    },
    'mercedes_c63_2024': {
        'driver_front': 'mercedes_c63_driver_front_<TIMESTAMP>.png',
        // ... etc
    }
};
    `);
}

main().catch(console.error);
