const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = 'output/approval_manifest.json';
const GALLERY_PATH = 'output/approval_gallery.html';

function buildGallery() {
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error("Manifest not found!");
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Gemini Render Approval</title>
    <style>
        body { background: #111; color: #eee; font-family: sans-serif; padding: 20px; }
        .model-section { border: 1px solid #333; margin-bottom: 30px; padding: 20px; border-radius: 8px; background: #1a1a1a; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .title { font-size: 1.2em; font-weight: bold; color: #00ff88; }
        .badge { padding: 5px 10px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .badge.high { background: #1b5e20; color: #a5d6a7; }
        .badge.partial { background: #e65100; color: #ffcc80; }
        .badge.missing { background: #b71c1c; color: #ffcdd2; }
        
        .grid { display: grid; grid-template-columns: repeat(10, 1fr); gap: 10px; }
        .card { background: #000; border: 1px solid #333; aspect-ratio: 16/9; position: relative; overflow: hidden; }
        .card img { width: 100%; height: 100%; object-fit: cover; }
        .card.missing { display: flex; align-items: center; justify-content: center; color: #555; font-size: 0.8em; border: 1px dashed #444; }
        .meta { font-size: 0.7em; color: #888; margin-top: 5px; }
        
        .path-info { font-family: monospace; font-size: 0.8em; color: #666; margin-bottom: 10px; word-break: break-all; }
    </style>
</head>
<body>
    <h1>Gemini Render Verification Gallery</h1>
    <p>Review the identified "Dark Studio" renders below. Only "High Confidence" sets will be processed for upload.</p>
`;

    // Sort models: High confidence first
    const sortedKeys = Object.keys(manifest.models).sort((a, b) => {
        const confOrder = { 'high': 0, 'partial': 1, 'missing': 2, 'none': 3 };
        return confOrder[manifest.models[a].confidence] - confOrder[manifest.models[b].confidence];
    });

    sortedKeys.forEach(key => {
        const m = manifest.models[key];
        const angleCount = Object.keys(m.angles).length;

        html += `
    <div class="model-section">
        <div class="header">
            <div class="title">${m.name}</div>
            <div class="badge ${m.confidence}">${m.confidence.toUpperCase()} (${angleCount}/10)</div>
        </div>
        <div class="grid">
`;

        for (let i = 1; i <= 10; i++) {
            const angleKey = `angle_${String(i).padStart(2, '0')}`;
            const angleData = m.angles[angleKey];

            if (angleData) {
                // Calculate relative path from output/ directory if possible, or relative to root
                // The gallery needs to load local files. Browser security might block absolute paths without a server.
                // However, for user review via "open file", relative paths from the HTML location work best.
                // HTML is in output/ folder.
                // Files are in root/tmp or root/output...
                // Only way to show is if we assume user opens this in a way that can see ../

                // Let's rely on relative path from 'output/' to root
                const relativePath = path.relative('output', angleData.path);

                html += `
            <div class="card">
                <img src="${relativePath}" title="${angleData.path}">
            </div>`;
            } else {
                html += `
            <div class="card missing">
                MISSING<br>${angleKey}
            </div>`;
            }
        }

        html += `
        </div>
        ${Object.values(m.angles)[0] ? `<div class="path-info">Source: ${path.dirname(Object.values(m.angles)[0].path)}</div>` : ''}
    </div>`;
    });

    html += `
</body>
</html>`;

    fs.writeFileSync(GALLERY_PATH, html);
    console.log(`Gallery written to ${GALLERY_PATH}`);
}

buildGallery();
