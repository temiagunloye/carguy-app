const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkMercedesVariants() {
    console.log('🔍 Checking Mercedes Variants...');
    const carId = 'mercedes_c63_2024';
    
    // Check Car Doc first
    const carDoc = await db.collection('standardCars').doc(carId).get();
    if (!carDoc.exists) {
        console.log('❌ Car Document does NOT exist!');
        return;
    }
    const carData = carDoc.data();
    console.log('🚗 Car Found:', carData.displayName);
    console.log('   defaultVariantId:', carData.defaultVariantId);

    // Check Variants
    const variantsSnap = await db.collection('standardCarVariants')
        .where('standardCarId', '==', carId)
        .get();

    console.log(`🎨 Found ${variantsSnap.size} variants.`);
    variantsSnap.forEach(doc => {
        console.log(`   - ${doc.id} (${doc.data().colorName})`);
    });

    if (variantsSnap.empty) {
        console.log('⚠️ NO VARIANTS FOUND! This is why "Car not found" appears.');
    } else {
        // Check if defaultVariantId exists in the found variants
        const defaultExists = variantsSnap.docs.some(doc => doc.id === carData.defaultVariantId);
        console.log(`   Default variant ${carData.defaultVariantId} exists? ${defaultExists}`);
    }
}

checkMercedesVariants().catch(console.error);
