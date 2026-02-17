const admin = require('firebase-admin');
const fs = require('fs');
const https = require('https');
const path = require('path');

// Initialize Firebase
try {
    const serviceAccount = require('./serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
} catch (e) {
    console.log("⚠️ No service account, using default creds...");
    admin.initializeApp();
}

const db = admin.firestore();
const DEST_DIR = 'assets/optimized-models';

async function findAndDownload() {
    console.log("🔍 Searching Firestore for Mercedes and Audi models...");

    // Broad search since we don't know the exact IDs
    const snapshot = await db.collection('baseModels').get();

    const targets = ['mercedes', 'audi', 'c63', 'rs6'];
    const candidates = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        const str = JSON.stringify(data).toLowerCase();
        if (targets.some(t => str.includes(t))) {
            candidates.push({ id: doc.id, ...data });
        }
    });

    if (candidates.length === 0) {
        console.log("❌ No matching models found in 'baseModels' collection.");
        return;
    }

    console.log(`✅ Found ${candidates.length} candidates.`);

    for (const c of candidates) {
        if (!c.glbUrl) {
            console.log(`⚠️ Skiping ${c.id}: No glbUrl`);
            continue;
        }

        const destPath = path.join(DEST_DIR, `${c.id}.glb`);
        console.log(`⬇️ Downloading ${c.displayName} to ${destPath}...`);

        await downloadFile(c.glbUrl, destPath);
    }
}

function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, function (response) {
            response.pipe(file);
            file.on('finish', function () {
                file.close(() => {
                    console.log(`   ✅ Download complete: ${dest}`);
                    resolve();
                });
            });
        }).on('error', function (err) {
            fs.unlink(dest, () => { });
            console.error(`   ❌ Download failed: ${err.message}`);
            reject(err);
        });
    });
}

findAndDownload();
