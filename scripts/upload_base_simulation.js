const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize logic similar to existing scripts
const projectId = process.env.FIREBASE_PROJECT_ID || "carguy-app-demo";
try {
    admin.initializeApp({
        credential: admin.credential.cert(require("../serviceAccountKey.json")), // Try local key first
        storageBucket: `${projectId}.firebasestorage.app`
    });
} catch (e) {
    try {
        admin.initializeApp({
            projectId,
            storageBucket: `${projectId}.firebasestorage.app`
        });
    } catch (e2) { }
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const MANIFEST_PATH = 'output/simulation/manifest.json';

async function uploadAndRegister() {
    console.log('🚀 Starting Firebase Upload...');

    if (!fs.existsSync(MANIFEST_PATH)) {
        throw new Error('No manifest found. Run simulation first.');
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

    for (const car of manifest) {
        console.log(`\n📤 Uploading ${car.carId}...`);

        const photoAngles = {}; // Map: angleName -> gs:// path
        const photoAnglesHttp = {}; // Map: angleName -> https:// url

        let viewerOrder = [];

        for (const angle of car.angles) {
            const storagePath = `public/standardCars/${car.carId}/primary_angles/${angle.name}.jpg`;

            // Upload
            // We set cacheControl: immutable because these base assets don't change often
            await bucket.upload(angle.path, {
                destination: storagePath,
                metadata: {
                    contentType: 'image/jpeg',
                    cacheControl: 'public, max-age=31536000, immutable',
                    metadata: {
                        tier: car.status, // metadata tag
                        licenseCategory: 'PERMITTED'
                    }
                }
            });

            await bucket.file(storagePath).makePublic();

            const gsPath = `gs://${bucket.name}/${storagePath}`;
            const httpUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

            photoAngles[angle.name] = gsPath;
            photoAnglesHttp[angle.name] = httpUrl;
            viewerOrder.push(angle.name);
        }

        // Firestore Write
        console.log(`📝 Writing Firestore Doc: standardCars/${car.carId}`);
        await db.collection('standardCars').doc(car.carId).set({
            status: car.status, // 'approved' or 'draft_testing_only'
            photoAngles,
            photoAnglesHttp,
            viewerOrder, // Strict ordering for the viewer
            angleCount: 10,
            sourceType: "base_model",
            provenance: {
                tier: "TIER_1_OEM",
                generatedBy: "Antigravity Pipeline Simulation",
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    }

    console.log('\n✅ All Demo Cars Uploaded & Registered.');
}

uploadAndRegister().catch(console.error);
