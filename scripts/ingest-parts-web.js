#!/usr/bin/env node
/**
 * Ingest parts using Firebase Web SDK
 * Uploads to Storage and registers in Firestore with proper placement defaults
 */

const { initializeApp } = require('firebase/app');
const { getStorage, ref, uploadBytes, getDownloadURL } = require('firebase/storage');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Firebase Config
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

const INPUT_DIR = 'assets/parts-raw';
const VERSION = 'v1';

// Defaults configuration (Phase C)
const CATEGORY_DEFAULTS = {
    wheel_aftermarket_01: {
        category: 'wheel',
        displayName: 'Aftermarket 5-Spoke',
        defaults: {
            anchorPattern: 'ANCHOR_WHEEL_*',
            scaleMode: 'relativeToWheelAnchors',
            offset: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    },
    front_lip_01: {
        category: 'front_lip',
        displayName: 'Carbon Splitter',
        defaults: {
            anchorName: 'ANCHOR_FRONT_CENTER_LOW',
            scaleMode: 'relativeToCarWidth',
            offset: { x: 0, y: -0.05, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    },
    side_skirt_01: {
        category: 'side_skirt',
        displayName: 'Aero Side Skirts',
        defaults: {
            // Special handling: will be handled by viewer logic to apply to L/R
            anchorPattern: 'ANCHOR_SIDE_*_LOW',
            scaleMode: 'relativeToWheelbase',
            offset: { x: 0, y: -0.05, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    },
    rear_diffuser_01: {
        category: 'rear_diffuser',
        displayName: 'Race Diffuser',
        defaults: {
            anchorName: 'ANCHOR_REAR_CENTER_LOW',
            scaleMode: 'relativeToCarWidth',
            offset: { x: 0, y: -0.05, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    }
};

async function processFiles() {
    console.log('🚀 Starting Part Ingestion (Web SDK)...\n');

    // Get files
    const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.glb'));

    for (const file of files) {
        const basename = path.basename(file, '.glb');
        const config = CATEGORY_DEFAULTS[basename];

        if (!config) {
            console.warn(`⚠️  Skipping unknown part: ${basename}`);
            continue;
        }

        console.log(`Processing ${basename}...`);

        try {
            // Read file
            const filePath = path.join(INPUT_DIR, file);
            const fileBuffer = fs.readFileSync(filePath);

            // Upload
            const storagePath = `models/parts/${basename}/${VERSION}/model.glb`;
            const storageRef = ref(storage, storagePath);
            const metadata = {
                contentType: 'model/gltf-binary',
                cacheControl: 'public,max-age=31536000',
                customMetadata: { partId: basename, version: VERSION }
            };

            console.log(`   Uploading to ${storagePath}...`);
            await uploadBytes(storageRef, fileBuffer, metadata);
            const publicUrl = await getDownloadURL(storageRef);
            console.log(`   ✅ URL: ${publicUrl}`);

            // Register Firestore
            const docRef = doc(db, 'parts', basename);
            await setDoc(docRef, {
                partId: basename,
                displayName: config.displayName,
                category: config.category,
                storagePath,
                glbUrl: publicUrl,
                active: true,
                compatibleAnchorsVersion: 'v1',
                activeVersion: VERSION,
                placementDefaults: config.defaults,
                license: {
                    type: 'Generated',
                    sourceUrl: 'Internal',
                    attributionText: 'Procedurally generated placeholder'
                },
                qualityScore: 3,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            console.log(`   ✅ Registered parts/${basename}`);

        } catch (error) {
            console.error(`❌ Failed:`, error.message);
        }
    }

    console.log('\n✨ Part ingestion complete!');
    process.exit(0);
}

processFiles();
