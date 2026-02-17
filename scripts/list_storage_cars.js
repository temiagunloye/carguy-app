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

async function listAllCars() {
    console.log("📂 Checking Firebase Storage for car renders...\n");

    try {
        const [files] = await bucket.getFiles({ prefix: 'standardCars/' });

        const carFolders = {};
        files.forEach(file => {
            const parts = file.name.split('/');
            if (parts.length >= 2) {
                const carId = parts[1];
                if (!carFolders[carId]) carFolders[carId] = [];
                if (file.name.includes('renders/')) {
                    carFolders[carId].push(file.name);
                }
            }
        });

        Object.entries(carFolders).forEach(([carId, files]) => {
            console.log(`\n🚗 ${carId}:`);
            console.log(`   Files found: ${files.length}`);
            if (files.length > 0) {
                console.log(`   Sample: ${files[0]}`);
            }
        });

    } catch (e) {
        console.error("Error:", e.message);
    }
}

listAllCars().catch(console.error);
