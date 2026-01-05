// test-kiri-upload.js
// Standalone script to test KIRI 3D reconstruction with real car photos

const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const KIRI_API_KEY = process.env.KIRI_API_KEY || 'kiri_AI7-uEkWGeQ3iIDazVdXKQp8RF8KzsN7R73oSOZUv1Q';
const KIRI_API_BASE = 'https://api.kiriengine.app';

// 10 car photos for photogrammetry
const PHOTOS = [
    'IMG_4033.jpg',  // High quality JPG
    'IMG_4037.png',
    'IMG_4038.png',
    'IMG_4039.png',
    'IMG_4040.png',
    'IMG_4041.png',
    'IMG_4044.png',
    'IMG_4045.png',
    'IMG_4046.jpg',  // Newly uploaded driver side
    'IMG_4047.png',
];

async function uploadToKiri() {
    try {
        console.log('🚗 KIRI 3D Reconstruction Test');
        console.log('='.repeat(50));

        // Step 1: Upload all photos to get a photoset ID
        console.log(`\n📤 Step 1: Uploading ${PHOTOS.length} photos...`);
        const uploadedPhotos = [];

        for (let i = 0; i < PHOTOS.length; i++) {
            const photo = PHOTOS[i];
            const photoPath = `test-photos/${photo}`;

            if (!fs.existsSync(photoPath)) {
                console.log(`⚠️  Skipping ${photo} - file not found`);
                continue;
            }

            const formData = new FormData();
            formData.append('file', fs.createReadStream(photoPath));

            try {
                const uploadRes = await axios.post(`${KIRI_API_BASE}/api/v1/open/photo/image`, formData, {
                    headers: {
                        'X-Api-Token': KIRI_API_KEY,
                        ...formData.getHeaders(),
                    },
                });

                uploadedPhotos.push(uploadRes.data);
                console.log(`  ✅ [${i + 1}/${PHOTOS.length}] ${photo}`);
            } catch (uploadErr) {
                console.error(`  ❌ [${i + 1}/${PHOTOS.length}] ${photo} - ${uploadErr.response?.data || uploadErr.message}`);
            }
        }

        if (uploadedPhotos.length === 0) {
            throw new Error('No photos were uploaded successfully');
        }

        console.log(`\n✅ Uploaded ${uploadedPhotos.length} photos`);

        // Step 2: Create photo scan task 
        console.log('\n📦 Step 2: Creating KIRI photo scan task...');

        // Extract photo IDs from uploaded photos
        const photoIds = uploadedPhotos.map((p, idx) => ({
            id: p.id || p.photoId || idx,
            url: p.url || p.imageUrl,
        }));

        const createTaskRes = await axios.post(`${KIRI_API_BASE}/api/v1/open/photo/create-task`, {
            photoset: photoIds,
            quality: 'high',
            exportFormats: ['glb', 'usdz'],
        }, {
            headers: {
                'X-Api-Token': KIRI_API_KEY,
                'Content-Type': 'application/json',
            },
        });

        const taskId = createTaskRes.data.id || createTaskRes.data.taskId;
        console.log(`✅ Task created: ${taskId}`);

        console.log('\n' + '='.repeat(50));
        console.log('📊 SCAN DETAILS:');
        console.log(`   Task ID: ${taskId}`);
        console.log(`   Photos Uploaded: ${uploadedPhotos.length}`);
        console.log('='.repeat(50));

        // Step 3: Poll status
        console.log('\n⏳ Step 3: Monitoring status (polling every 30s)...\n');
        await pollStatus(taskId);

    } catch (error) {
        console.error('\n❌ Error:', error.response?.data || error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

async function pollStatus(scanId) {
    const startTime = Date.now();
    let lastStatus = null;

    const checkStatus = async () => {
        try {
            const res = await axios.get(`${KIRI_API_BASE}/v2/scans/${scanId}`, {
                headers: {
                    'Authorization': `Bearer ${KIRI_API_KEY}`,
                },
            });

            const data = res.data;
            const elapsed = Math.round((Date.now() - startTime) / 1000);

            if (data.status !== lastStatus) {
                const statusEmoji = {
                    'CREATED': '📝',
                    'UPLOADING': '📤',
                    'PROCESSING': '⚙️',
                    'COMPLETED': '✅',
                    'FAILED': '❌',
                };

                console.log(`${statusEmoji[data.status] || '📊'} [${elapsed}s] Status: ${data.status}`);

                if (data.progress) {
                    console.log(`   Progress: ${data.progress}%`);
                }

                lastStatus = data.status;
            }

            if (data.status === 'COMPLETED') {
                console.log('\n' + '='.repeat(50));
                console.log('🎉 3D MODEL READY!');
                console.log('='.repeat(50));
                console.log(`📥 Model URL: ${data.modelUrl || data.glbUrl || 'Processing...'}`);
                console.log(`🌐 Viewer URL: ${data.viewerUrl || data.shareUrl || 'Processing...'}`);
                console.log('='.repeat(50));

                // Save results
                fs.writeFileSync('kiri-result.json', JSON.stringify(data, null, 2));
                console.log('\n💾 Results saved to: kiri-result.json');

                return true;
            }

            if (data.status === 'FAILED') {
                console.error('\n❌ Processing failed:', data.error || 'Unknown error');
                return true;
            }

            // Continue polling
            return false;

        } catch (error) {
            console.error(`\n⚠️  Status check failed: ${error.message}`);
            return false;
        }
    };

    // Poll every 30 seconds
    while (true) {
        const done = await checkStatus();
        if (done) break;

        await new Promise(resolve => setTimeout(resolve, 30000));
    }
}

// Run the upload
uploadToKiri().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
