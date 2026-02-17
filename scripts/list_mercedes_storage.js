const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'carguy-app-demo.firebasestorage.app'
    });
}

const bucket = admin.storage().bucket();

async function listMercedesFiles() {
    console.log('📂 Listing Mercedes Renders...');
    const prefix = 'standardCars/mercedes_c63_2024/renders/';

    try {
        const [files] = await bucket.getFiles({ prefix });

        if (files.length === 0) {
            console.log('⚠️ No files found in', prefix);
            return;
        }

        console.log(`✅ Found ${files.length} files:`);
        files.forEach(file => {
            console.log(`   - ${file.name}`);
        });
    } catch (error) {
        console.error('❌ Error listing files:', error);
    }
}

listMercedesFiles();
