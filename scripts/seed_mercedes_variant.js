const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function seedMercedesVariant() {
    console.log('🌱 Seeding Mercedes Variant...');
    const carId = 'mercedes_c63_2024';
    const variantId = 'mercedes_c63_2024_matte_coal';

    // 1. Create Variant
    const variantData = {
        standardCarId: carId,
        variantType: 'dealer_paint',
        colorName: 'Matte Coal',
        colorKey: 'matte_coal',
        status: 'approved',
        thumbPath: 'standardCars/mercedes_c63_2024/renders/front_center.png',
        angleAssets: {
            'front': 'standardCars/mercedes_c63_2024/renders/front_center.png', // Fallback for front
            'front_low': 'standardCars/mercedes_c63_2024/renders/front_low.png',
            'front_center': 'standardCars/mercedes_c63_2024/renders/front_center.png',
            'driver_front': 'standardCars/mercedes_c63_2024/renders/driver_front.png',
            'full_driver_side': 'standardCars/mercedes_c63_2024/renders/full_driver_side.png',
            'driver_rear': 'standardCars/mercedes_c63_2024/renders/driver_rear.png',
            'rear': 'standardCars/mercedes_c63_2024/renders/rear_center.png',
            'rear_low': 'standardCars/mercedes_c63_2024/renders/rear_low.png',
            'passenger_rear': 'standardCars/mercedes_c63_2024/renders/passenger_rear.png'
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('standardCarVariants').doc(variantId).set(variantData);
    console.log('✅ Variant created:', variantId);

    // 2. Update Car with defaultVariantId
    await db.collection('standardCars').doc(carId).update({
        defaultVariantId: variantId,
        dealerColorVariantIds: [variantId]
    });
    console.log('✅ Car updated with defaultVariantId');
}

seedMercedesVariant().catch(console.error);
