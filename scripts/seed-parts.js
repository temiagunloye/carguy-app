const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
    const serviceAccount = require('../serviceAccountKey.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: "carguy-app-demo.firebasestorage.app"
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

const WHEELS = [
    {
        id: 'audi-rs6-wheels',
        brand: 'Audi',
        product_name: 'Audi RS 6 Performance Wheels',
        specs: '22" 5-V-Spoke Trapezoid',
        vehicle: 'audi_rs6_2024',
        images: [
            'uploaded_media_0_1769537680096.jpg',
            'uploaded_media_1_1769537680096.jpg'
        ]
    },
    {
        id: 'bmw-m3-bbs',
        brand: 'BBS',
        product_name: 'BBS Forged FI-R',
        specs: 'Platinum Silver / Lightweight Forged',
        vehicle: 'bmw_m3_2024',
        images: [
            'uploaded_media_2_1769537680096.jpg',
            'uploaded_media_3_1769537680096.png',
            'uploaded_media_4_1769537680096.png'
        ]
    },
    {
        id: 'mercedes-rohana-rfx17',
        brand: 'Rohana',
        product_name: 'Rohana RFX17',
        specs: '19" Titanium Forged Concave',
        vehicle: 'mercedes_c63_2024',
        images: [
            'uploaded_media_0_1769537717092.jpg',
            'uploaded_media_1_1769537717092.jpg'
        ]
    },
    {
        id: 'brz-volk-te37',
        brand: 'Volk Racing',
        product_name: 'Volk Racing TE37 Saga S-Plus',
        specs: '17x9.5 / +46 / 5x100 / Bronze',
        vehicle: 'subaru_brz_2022',
        images: [
            'uploaded_media_2_1769537717092.jpg',
            'uploaded_media_3_1769537717092.jpg',
            'uploaded_media_4_1769537717092.jpg'
        ]
    },
    {
        id: 'porsche-911-manthey',
        brand: 'Manthey Racing',
        product_name: 'Manthey Racing Carbon Aero Disc Set (991)',
        specs: 'Carbon Fiber / Aero Optimized',
        vehicle: 'porsche_911_2024',
        images: [
            'uploaded_media_0_1769537744559.jpg',
            'uploaded_media_1_1769537744559.jpg',
            'uploaded_media_2_1769537744559.jpg'
        ]
    }
];

const WRAPS = [
    {
        id: 'matte-coal-mt01',
        brand: 'Teckwrap',
        product_name: 'Matte Coal Vinyl Wrap MT01',
        finish: 'Matte',
        vehicles: ['subaru_brz_2022', 'mercedes_c63_2024'],
        images: [
            'uploaded_media_0_1769537766882.jpg',
            'uploaded_media_1_1769537766882.jpg',
            'uploaded_media_2_1769537766882.jpg',
            'uploaded_media_0_1769537848399.png',
            'uploaded_media_1_1769537848399.jpg',
            'uploaded_media_2_1769537848399.png'
        ]
    },
    {
        id: 'camo-green-cg51',
        brand: 'Teckwrap',
        product_name: 'Camouflage Green (CG51-HD)',
        finish: 'Gloss/HD',
        vehicles: ['porsche_911_2024'],
        images: [
            'uploaded_media_0_1769537795794.jpg',
            'uploaded_media_1_1769537795794.jpg',
            'uploaded_media_2_1769537795794.jpg',
            'uploaded_media_3_1769537795794.jpg'
        ]
    },
    {
        id: 'toronto-red-bmw',
        brand: 'BMW',
        product_name: 'Toronto Red Metallic',
        finish: 'Metallic',
        vehicles: ['bmw_m3_2024'],
        images: [
            'uploaded_media_0_1769537865167.jpg',
            'uploaded_media_1_1769537865167.jpg',
            'uploaded_media_2_1769537865167.jpg'
        ]
    },
    {
        id: 'ultra-blue-metallic',
        brand: 'Audi',
        product_name: 'Ultra Blue Metallic (Purple)',
        finish: 'Metallic/Purple',
        vehicles: ['audi_rs6_2024'],
        images: [
            'uploaded_media_0_1769537886319.jpg',
            'uploaded_media_1_1769537886319.jpg',
            'uploaded_media_2_1769537886319.jpg',
            'uploaded_media_3_1769537886319.jpg'
        ]
    }
];

async function uploadFile(localName, remotePath) {
    const localPath = path.join(__dirname, '../website/assets/images', localName);
    if (!fs.existsSync(localPath)) {
        console.warn(`File not found: ${localPath}`);
        return null;
    }

    await bucket.upload(localPath, {
        destination: remotePath,
        public: true,
        metadata: {
            cacheControl: 'public, max-age=31536000',
        }
    });

    return `https://storage.googleapis.com/${bucket.name}/${remotePath}`;
}

async function seed() {
    console.log('🚀 Seeding Wheels...');
    for (const wheel of WHEELS) {
        const imageUrls = [];
        for (const img of wheel.images) {
            const url = await uploadFile(img, `parts/wheels/${wheel.id}/${img}`);
            if (url) imageUrls.push(url);
        }

        await db.collection('wheels').doc(wheel.id).set({
            ...wheel,
            category: 'wheels',
            imageUrls,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Seeded Wheel: ${wheel.product_name}`);
    }

    console.log('\n🚀 Seeding Wraps...');
    for (const wrap of WRAPS) {
        const imageUrls = [];
        for (const img of wrap.images) {
            const url = await uploadFile(img, `parts/wraps/${wrap.id}/${img}`);
            if (url) imageUrls.push(url);
        }

        await db.collection('wraps').doc(wrap.id).set({
            ...wrap,
            category: 'wraps',
            imageUrls,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`✅ Seeded Wrap: ${wrap.product_name}`);
    }

    console.log('\n🎉 Seeding Complete!');
}

seed().catch(console.error);
