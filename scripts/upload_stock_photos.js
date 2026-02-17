const https = require('https');
const fs = require('fs');
const path = require('path');
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
const db = admin.firestore();

// Free stock photo URLs (Unsplash - free to use)
const STOCK_PHOTOS = {
    bmw_m3_2024: {
        driver_front: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1920',
        passenger_front: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1920',
        full_driver_side: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=1920',
        full_passenger_side: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1920',
        driver_rear: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1920',
        passenger_rear: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1920',
        front_center: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1920',
        rear_center: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1920',
        front_low: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1920',
        rear_low: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1920'
    },
    audi_rs6_2024: {
        driver_front: 'https://images.unsplash.com/photo-1610768764270-790fbec18178?w=1920',
        passenger_front: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=1920',
        full_driver_side: 'https://images.unsplash.com/photo-1606016159991-1a31b0a17b5e?w=1920',
        full_passenger_side: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=1920',
        driver_rear: 'https://images.unsplash.com/photo-1606016159991-1a31b0a17b5e?w=1920',
        passenger_rear: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=1920',
        front_center: 'https://images.unsplash.com/photo-1610768764270-790fbec18178?w=1920',
        rear_center: 'https://images.unsplash.com/photo-1606016159991-1a31b0a17b5e?w=1920',
        front_low: 'https://images.unsplash.com/photo-1610768764270-790fbec18178?w=1920',
        rear_low: 'https://images.unsplash.com/photo-1606016159991-1a31b0a17b5e?w=1920'
    },
    mercedes_c63_2024: {
        driver_front: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1920',
        passenger_front: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1920',
        full_driver_side: 'https://images.unsplash.com/photo-1617531653520-bd466cc2b8e3?w=1920',
        full_passenger_side: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1920',
        driver_rear: 'https://images.unsplash.com/photo-1617531653520-bd466cc2b8e3?w=1920',
        passenger_rear: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1920',
        front_center: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1920',
        rear_center: 'https://images.unsplash.com/photo-1617531653520-bd466cc2b8e3?w=1920',
        front_low: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1920',
        rear_low: 'https://images.unsplash.com/photo-1617531653520-bd466cc2b8e3?w=1920'
    },
    subaru_brz_2024: {
        driver_front: 'https://images.unsplash.com/photo-1607603750410-c9e5eb8f638c?w=1920',
        passenger_front: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1920',
        full_driver_side: 'https://images.unsplash.com/photo-1607603750410-c9e5eb8f638c?w=1920',
        full_passenger_side: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1920',
        driver_rear: 'https://images.unsplash.com/photo-1607603750410-c9e5eb8f638c?w=1920',
        passenger_rear: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=1920',
        front_center: 'https://images.unsplash.com/photo-1607603750410-c9e5eb8f638c?w=1920',
        rear_center: 'https://images.unsplash.com/photo-1607603750410-c9e5eb8f638c?w=1920',
        front_low: 'https://images.unsplash.com/photo-1607603750410-c9e5eb8f638c?w=1920',
        rear_low: 'https://images.unsplash.com/photo-1607603750410-c9e5eb8f638c?w=1920'
    }
};

async function downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            if (response.statusCode === 302 || response.statusCode === 301) {
                return downloadImage(response.headers.location, outputPath).then(resolve).catch(reject);
            }
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }
            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve(outputPath);
            });
            fileStream.on('error', reject);
        }).on('error', reject);
    });
}

async function processOneCar(carId, angles) {
    console.log(`\n🚗 Processing ${carId}...`);

    const tmpDir = path.join(__dirname, '../tmp/car-stock-photos', carId);
    fs.mkdirSync(tmpDir, { recursive: true });

    const photoAnglesHttp = {};
    const photoAngles = {};

    for (const [angleName, url] of Object.entries(angles)) {
        try {
            // Download to temp
            const tmpPath = path.join(tmpDir, `${angleName}.jpg`);
            console.log(`   ⬇️  ${angleName}...`);
            await downloadImage(url, tmpPath);

            // Upload to Firebase Storage
            const destination = `standardCars/${carId}/renders/${angleName}.jpg`;
            await bucket.upload(tmpPath, {
                destination,
                metadata: {
                    contentType: 'image/jpeg',
                    cacheControl: 'public, max-age=31536000'
                }
            });

            const file = bucket.file(destination);
            await file.makePublic();

            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
            photoAnglesHttp[angleName] = publicUrl;
            photoAngles[angleName] = `gs://${bucket.name}/${destination}`;

            console.log(`      ✅ Uploaded`);

            // Clean up temp file
            fs.unlinkSync(tmpPath);

        } catch (error) {
            console.error(`      ❌ Failed: ${error.message}`);
        }
    }

    // Update Firestore
    await db.collection('standardCars').doc(carId).set({
        photoAnglesHttp,
        photoAngles,
        renderSource: 'unsplash_stock_photos',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    console.log(`   ✅ ${carId} complete!`);
}

async function main() {
    console.log('🚀 Downloading and uploading stock car photos...\n');

    for (const [carId, angles] of Object.entries(STOCK_PHOTOS)) {
        await processOneCar(carId, angles);
    }

    console.log('\n✅ All cars updated with stock photos!');
    console.log('\n📝 Note: These are generic stock photos, not exact car models');
    console.log('   They provide car-specific styling but are not perfect renders');
}

main().catch(console.error);
