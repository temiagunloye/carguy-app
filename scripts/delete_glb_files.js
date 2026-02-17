const admin = require('firebase-admin');

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

async function deleteGLBFiles() {
    console.log("🗑️  Deleting GLB files from Firebase Storage...\n");

    try {
        const [files] = await bucket.getFiles({ prefix: 'models/' });

        const glbFiles = files.filter(f => f.name.endsWith('.glb'));

        console.log(`Found ${glbFiles.length} GLB files:\n`);

        let totalSize = 0;
        for (const file of glbFiles) {
            const [metadata] = await file.getMetadata();
            const sizeBytes = parseInt(metadata.size);
            const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);
            totalSize += sizeBytes;

            console.log(`   🗑️  ${file.name} (${sizeMB} MB)`);
            await file.delete();
            console.log(`      ✓ Deleted`);
        }

        const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
        console.log(`\n✅ Deleted ${glbFiles.length} GLB files, freed ${totalMB} MB!`);

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

deleteGLBFiles().catch(console.error);
