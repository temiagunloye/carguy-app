const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function audit() {
    console.log("🔍 Auditing baseModels for GLB URLs...");
    const snapshot = await db.collection('baseModels').get();
    let found = 0;

    snapshot.forEach(doc => {
        const d = doc.data();
        if (d.make === 'Mercedes-Benz' || d.make === 'Audi' || d.model.includes('C63') || d.model.includes('RS6')) {
            console.log(`\n📌 Found Potential Match: ${doc.id}`);
            console.log(`   - Display: ${d.displayName}`);
            console.log(`   - GLB URL: ${d.glbUrl || 'MISSING'}`);
            console.log(`   - Storage Path: ${d.storagePath || 'MISSING'}`);
            found++;
        }
    });

    if (found === 0) console.log("❌ No Mercedes or Audi models found in DB.");
}

audit();
