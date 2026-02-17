const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function listCars() {
    const cars = await db.collection('standardCars').get();
    cars.forEach(doc => console.log(doc.id));
}

listCars().catch(console.error);
