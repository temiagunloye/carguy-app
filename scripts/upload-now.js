// Simple upload script using Firebase Web SDK
const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { getFirestore, doc, setDoc } = require('firebase/firestore');
const fs = require('fs');

const firebaseConfig = {
    apiKey: "AIzaSyCEFvcV4MKlxtXOiZXRFTL8xVSGuKsPme8",
    authDomain: "carguy-app-demo.firebaseapp.com",
    projectId: "carguy-app-demo",
    storageBucket: "carguy-app-demo.firebasestorage.app",
    messagingSenderId: "869343833766",
    appId: "1:869343833766:web:d80b4034b146525a588e67"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const models = [
    {
        localPath: 'assets/optimized-models/porsche_911_2024.glb',
        storagePath: 'models/base/demo/porsche_911_2024_v1.glb',
        docId: 'porsche_911_2024',
        displayName: '2024 Porsche 911 Carrera 4S',
        make: 'Porsche',
        model: '911',
        year: 2024,
        bodyStyle: 'coupe',
        polyCount: 81166
    },
    {
        localPath: 'assets/optimized-models/bmw_m3_2023.glb',
        storagePath: 'models/base/demo/bmw_m3_2023_v1.glb',
        docId: 'bmw_m3_2023',
        displayName: '2023 BMW M3 Touring',
        make: 'BMW',
        model: 'M3',
        year: 2023,
        bodyStyle: 'wagon',
        polyCount: 69082
    },
    {
        localPath: 'assets/optimized-models/subaru_brz_2024.glb',
        storagePath: 'models/base/demo/subaru_brz_2022_v1.glb',
        docId: 'subaru_brz_2022',
        displayName: '2022 Subaru BRZ tS',
        make: 'Subaru',
        model: 'BRZ',
        year: 2022,
        bodyStyle: 'coupe',
        polyCount: 55945
    }
];

async function uploadAll() {
    console.log('🚀 Starting upload...\n');

    for (const model of models) {
        try {
            console.log(`📤 Uploading ${model.displayName}...`);

            // Read file
            const fileBuffer = fs.readFileSync(model.localPath);
            const fileSizeBytes = fileBuffer.length;
            const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(2);

            // Upload to Storage
            const storageRef = ref(storage, model.storagePath);
            const metadata = {
                contentType: 'model/gltf-binary',
                cacheControl: 'public,max-age=31536000'
            };

            await uploadBytes(storageRef, fileBuffer, metadata);
            const downloadURL = await getDownloadURL(storageRef);

            console.log(`✅ Uploaded (${fileSizeMB}MB)`);
            console.log(`   URL: ${downloadURL.substring(0, 80)}...`);

            // Create Firestore document
            const docRef = doc(db, 'baseModels', model.docId);
            await setDoc(docRef, {
                modelId: model.docId,
                displayName: model.displayName,
                make: model.make,
                model: model.model,
                year: model.year,
                bodyStyle: model.bodyStyle,
                glbUrl: downloadURL,
                storagePath: `gs://carguy-app-demo.firebasestorage.app/${model.storagePath}`,
                version: 'v1',
                demo: true,
                active: true,
                glbSize: fileSizeBytes,
                metadata: {
                    polyCount: model.polyCount,
                    version: '1.0',
                    dateAdded: new Date()
                },
                tags: [model.make.toLowerCase(), model.model.toLowerCase(), model.year.toString(), 'demo']
            });

            console.log(`✅ Registered in Firestore: baseModels/${model.docId}\n`);

        } catch (error) {
            console.error(`❌ Error with ${model.displayName}:`, error.message);
        }
    }

    console.log('🎉 All done! Models are now browsable in the app.');
    process.exit(0);
}

uploadAll().catch(err => {
    console.error('❌ Failed:', err);
    process.exit(1);
});
