const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "carguy-app-demo.firebasestorage.app"
    });
}
const bucket = admin.storage().bucket();
const db = admin.firestore();

const BATCH_DIR = path.join(__dirname, '../renders/batch_01');

async function uploadFile(localPath, remotePath) {
    await bucket.upload(localPath, {
        destination: remotePath,
        public: true,
        metadata: { cacheControl: 'public, max-age=31536000' }
    });
    return `https://storage.googleapis.com/${bucket.name}/${remotePath}`;
}

async function processBatch() {
    console.log("🚀 Starting Batch Upload...");

    if (!fs.existsSync(BATCH_DIR)) {
        console.warn("Batch directory not found (yet?).");
        return;
    }

    const buildDirs = fs.readdirSync(BATCH_DIR).filter(f => fs.statSync(path.join(BATCH_DIR, f)).isDirectory());

    for (const buildDir of buildDirs) {
        console.log(`\nProcessing: ${buildDir}`);
        const localBuildPath = path.join(BATCH_DIR, buildDir);
        const manifestPath = path.join(localBuildPath, 'manifest.json');

        if (!fs.existsSync(manifestPath)) {
            console.warn(`⚠️ No manifest.json found in ${buildDir}. Skipping...`);
            continue;
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const buildId = buildDir; // Assumes folder name is buildId

        // 1. Upload Images
        const photoAnglesHttp = {};
        for (const angle of manifest.angles) {
            const localFile = path.join(localBuildPath, angle.filename);
            const remoteFile = `renders/builds/${buildId}/${angle.filename}`;

            if (fs.existsSync(localFile)) {
                console.log(`   Uploading ${angle.filename}...`);
                const url = await uploadFile(localFile, remoteFile);
                photoAnglesHttp[angle.angleId] = url; // Use ID keys "01", "02" or map to "front", "side"?
                // The viewer expects "front", "side" etc?
                // Visualizer V2 uses keys mostly?
                // Actually, Manifest-based viewer should use ordered list.
                // But for backward compat, let's map known IDs to legacy keys if possible.
                // Or just store the raw map.
            }
        }

        // 2. Upload Manifest
        console.log(`   Uploading manifest.json...`);
        const remoteManifest = `renders/builds/${buildId}/manifest.json`;
        await uploadFile(manifestPath, remoteManifest);

        // 3. Update Firestore
        // We need to find the document in 'builds' collection that corresponds to this.
        // Or create it?
        // Actually, buildId might be "porsche_911_2024_army_green".
        // In DB, builds are e.g. "porsche_911_2024_camo-green-cg51_porsche-911-manthey".
        // My batch script named them simply.
        // I should stick to the simple ID for now, or assume this is a new "Canonical Build".

        const docRef = db.collection('builds').doc(buildId);
        await docRef.set({
            ...manifest.paintConfig, // store config
            photoAnglesHttp,
            manifestUrl: `https://storage.googleapis.com/${bucket.name}/${remoteManifest}`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'ready',
            isCanonical: true
        }, { merge: true });

        console.log(`✅ Uploaded & Synced: ${buildId}`);
    }
}

processBatch().catch(console.error);
