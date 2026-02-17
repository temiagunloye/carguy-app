const fs = require('fs');
const https = require('https');
const path = require('path');

// Target: Khronos Sample ToyCar (Reliable, Public, GLB)
// We rename it to "porsche_911.glb" for the pipeline's sake
const MODEL_URL = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/ToyCar/glTF-Binary/ToyCar.glb";
const DEST_DIR = "assets/models/raw";
const DEST_FILE = path.join(DEST_DIR, "porsche_911.glb"); // Mocking Porsche for test

if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
}

console.log(`Downloading Sample Model from ${MODEL_URL}...`);
const file = fs.createWriteStream(DEST_FILE);

https.get(MODEL_URL, (response) => {
    if (response.statusCode !== 200) {
        console.error(`Failed to download: ${response.statusCode}`);
        return;
    }
    response.pipe(file);
    file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded to ${DEST_FILE}`);
        console.log("👉 Now run: npm run ingest:render");
    });
}).on('error', (err) => {
    fs.unlink(DEST_FILE, () => { }); // Delete failed file
    console.error(`Error: ${err.message}`);
});
