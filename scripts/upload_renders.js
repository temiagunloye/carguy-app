const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

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
const db = admin.firestore();
const bucket = admin.storage().bucket();

const RENDER_DIR = 'output/renders';

async function uploadRenders() {
    console.log("🚀 Starting Render Upload Pipeline...");

    if (!fs.existsSync(RENDER_DIR)) {
        console.error(`❌ Render directory ${RENDER_DIR} not found. Run ingest:render first.`);
        return;
    }

    const carDirs = fs.readdirSync(RENDER_DIR).filter(f => fs.statSync(path.join(RENDER_DIR, f)).isDirectory());

    for (const carId of carDirs) {
        console.log(`\n🚗 Processing Renders for ${carId}...`);
        const carPath = path.join(RENDER_DIR, carId);
        const files = fs.readdirSync(carPath).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));

        const updateData = {
            photoAngles: {},
            photoAnglesHttp: {},
            renderSource: 'blender_studio_v1',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        for (const file of files) {
            const angleName = path.parse(file).name; // e.g. "front"
            const localPath = path.join(carPath, file);
            const destination = `standardCars/${carId}/renders/${file}`;

            console.log(`   ⬆️  Uploading ${angleName}...`);

            await bucket.upload(localPath, {
                destination: destination,
                metadata: {
                    contentType: mime.lookup(file) || 'image/png',
                    cacheControl: 'public, max-age=31536000'
                }
            });

            // Make public
            const fileRef = bucket.file(destination);
            await fileRef.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

            updateData.photoAngles[angleName] = `gs://${bucket.name}/${destination}`;
            updateData.photoAnglesHttp[angleName] = publicUrl;
        }

        // Update Firestore
        console.log(`   📝 Updating Firestore for ${carId}...`);
        await db.collection('standardCars').doc(carId).set(updateData, { merge: true });
    }

    console.log("\n✅ All Renders Uploaded & Synced.");
}

uploadRenders().catch(console.error);
