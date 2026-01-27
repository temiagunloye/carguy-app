const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkBuilds() {
    console.log('🔍 Checking for Featured Builds...');

    // Check for Porsche
    const porscheQuery = await db.collection('builds')
        .where('vehicleId', '==', 'porsche_911_2024')
        .where('isHero', '==', true)
        .get();

    console.log(`Porsche 911 2024 Found: ${porscheQuery.size}`);
    porscheQuery.docs.forEach(d => console.log(` - ${d.id}: ${d.data().name} (Angles: ${d.data().renderSet?.angles?.length})`));

    // Check for BRZ
    const brzQuery = await db.collection('builds')
        .where('vehicleId', '==', 'subaru_brz_2022')
        .where('isHero', '==', true)
        .get();

    console.log(`Subaru BRZ 2022 Found: ${brzQuery.size}`);
    brzQuery.docs.forEach(d => console.log(` - ${d.id}: ${d.data().name} (Angles: ${d.data().renderSet?.angles?.length})`));

    // Check for Mercedes
    const mercQuery = await db.collection('builds')
        .where('vehicleId', '==', 'mercedes_c63_2024')
        .where('isHero', '==', true)
        .get();

    console.log(`Mercedes C63 2024 Found: ${mercQuery.size}`);
    mercQuery.docs.forEach(d => console.log(` - ${d.id}: ${d.data().name} (Angles: ${d.data().renderSet?.angles?.length})`));
}

checkBuilds().catch(console.error);
