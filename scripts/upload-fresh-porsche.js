const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize
let serviceAccount = require('../serviceAccountKey.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "carguy-app-demo.firebasestorage.app"
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const TARGETS = [
    { folder: 'porsche_911_2024', id: 'porsche_911_2024', type: 'base' },
    { folder: 'porsche_911_manthey_build', id: 'porsche_911_manthey_build', type: 'build' }
];

async function upload() {
    console.log("🚀 Uploading Fresh HQ Porsche Renders...");

    for (const target of TARGETS) {
        const dir = path.resolve(__dirname, '../tmp/final_staging', target.folder);
        if (!fs.existsSync(dir)) {
            console.log(`❌ Missing dir: ${dir}`);
            continue;
        }

        const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
        const urls = {};

        console.log(`📦 Processing ${target.folder} (${files.length} images)...`);

        for (const file of files) {
            const local = path.join(dir, file);
            const dest = `renders/${target.id}/${file}`;

            await bucket.upload(local, {
                destination: dest,
                public: true,
                metadata: { cacheControl: 'public, max-age=300' } // Short cache for testing
            });

            const url = `https://storage.googleapis.com/${bucket.name}/${dest}`;
            urls[path.parse(file).name] = url;
            console.log(`   ✅ Uploaded ${file}`);
        }

        // Update Firestore if we have images
        if (Object.keys(urls).length > 0) {
            if (target.type === 'base') {
                await db.collection('baseModels').doc(target.id).update({
                    images: urls, // Partial update, merges with existing keys
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await db.collection('builds').doc(target.id).set({
                    images: urls,
                    photoAnglesHttp: urls,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            }
            console.log(`   📝 Firestore updated for ${target.id}`);
        }
    }
}

upload();
