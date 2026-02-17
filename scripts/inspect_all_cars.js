
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function inspectUserCars() {
    console.log('🔍 Inspecting User Cars...');

    // Get all users with cars in subcollection
    // This is a bit expensive but okay for a script
    const usersSnap = await db.collection('users').get();

    for (const userDoc of usersSnap.docs) {
        const carsSnap = await db.collection('users').doc(userDoc.id).collection('cars').get();
        if (!carsSnap.empty) {
            console.log(`\nUser: ${userDoc.id}`);
            carsSnap.forEach(doc => {
                const data = doc.data();
                console.log(`  Car ID: ${doc.id}`);
                console.log(`    Make/Model: ${data.make} ${data.model}`);
                console.log(`    standardCarId: ${data.standardCarId}`);
                console.log(`    imageUrl: ${data.imageUrl ? (data.imageUrl.substring(0, 50) + '...') : 'null'}`);
                console.log(`    dealerImageUrl: ${data.dealerImageUrl ? (data.dealerImageUrl.substring(0, 50) + '...') : 'null'}`);
            });
        }
    }
}

inspectUserCars().catch(console.error);
