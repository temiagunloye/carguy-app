const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = 'output/provenance_manifest.json';
const VIEWER_PATH = 'output/full_gallery_verification.html';

function buildViewer() {
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error("Manifest not found!");
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

    // Groupings per User Request
    const angleGroups = [
        { name: "Front & Front Side", angles: [1, 2, 7] },
        { name: "Rear & Rear Side", angles: [5, 6, 8] },
        { name: "Profile (Side Views)", angles: [3, 4] },
        { name: "Low Angles / Details", angles: [9, 10] }
    ];

    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Gemini Verification</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap" rel="stylesheet">
    <style>
        body { 
            background: #0f0f0f; 
            color: #eee; 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            display: flex; 
            height: 100vh; 
            overflow: hidden; 
        }
        
        /* Sidebar */
        aside {
            width: 300px;
            background: #161616;
            border-right: 1px solid #222;
            display: flex; flex-direction: column;
            flex-shrink: 0;
        }
        .brand {
            padding: 20px; 
            font-weight: 800; 
            color: #fff; 
            border-bottom: 1px solid #222;
            letter-spacing: -0.5px;
            font-size: 1.1em;
        }
        .nav-list { overflow-y: auto; flex-grow: 1; padding-top: 10px; }
        .nav-item {
            padding: 12px 20px;
            border-bottom: 1px solid #1f1f1f;
            cursor: pointer;
            font-size: 0.9em;
            display: flex; justify-content: space-between;
            align-items: center;
            transition: all 0.2s;
        }
        .nav-item:hover { background: #1f1f1f; color: #fff; }
        .nav-item.active { background: #252525; color: #fff; border-left: 3px solid #00ff99; padding-left: 17px; }
        
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .dot-green { background: #00ff99; box-shadow: 0 0 5px #00ff99; }
        .dot-yellow { background: #ffaa00; }
        .dot-red { background: #ff3333; }
        
        .nav-meta { font-size: 0.75em; color: #666; }

        /* Main Area */
        main { flex-grow: 1; overflow-y: auto; padding: 40px; background: #0f0f0f; }
        
        .model-container { display: none; max-width: 1400px; margin: 0 auto; }
        .header { margin-bottom: 40px; border-bottom: 1px solid #222; padding-bottom: 20px; }
        h1 { margin: 0; font-weight: 800; color: #fff; letter-spacing: -1px; font-size: 2em; }
        .subtitle { color: #888; font-size: 1em; margin-top: 5px; }
        
        /* Groups */
        .group-section { margin-bottom: 40px; }
        .group-label {
            font-size: 0.85em; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;
            color: #555; margin-bottom: 15px; border-bottom: 1px solid #222; padding-bottom: 8px;
        }
        
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .card {
            background: #1a1a1a;
            border: 1px solid #2a2a2a;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.2s;
            position: relative;
        }
        .card:hover { border-color: #444; transform: translateY(-2px); }
        
        .card.selected-gemini { border: 1px solid #00ff99; }
        .card.selected-weak { border: 1px solid #ffaa00; }
        .card.selected-bad { border: 1px solid #ff3333; opacity: 0.8; }
        .card.missing { border: 1px dashed #333; height: 200px; display: flex; align-items: center; justify-content: center; color: #444; flex-direction: column; }

        .img-wrap {
            aspect-ratio: 16/9;
            background: #000;
            position: relative;
            cursor: pointer; /* Implies clickable/zoomable */
        }
        .img-wrap img { width: 100%; height: 100%; object-fit: contain; }
        
        .meta {
            padding: 12px;
            font-size: 0.8em;
            color: #888;
            background: #1a1a1a;
            border-top: 1px solid #2a2a2a;
        }
        
        .badges { display: flex; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
        .badge { 
            padding: 3px 6px; border-radius: 4px; font-weight: 700; font-size: 0.85em; letter-spacing: 0.5px;
        }
        .badge-ts { background: #1b3a50; color: #4fc3f7; border: 1px solid #29b6f6; }
        .badge-dir { background: #2e2e2e; color: #ccc; border: 1px solid #444; }
        .badge-size { background: #333; color: #aaa; }
        .badge-score { background: #004d40; color: #00ff99; border: 1px solid #00ff99; }
        
        /* Candidates Expansion */
        .candidates-btn {
            background: #222; border: none; color: #666; width: 100%; 
            padding: 8px; cursor: pointer; font-size: 0.85em; font-weight: 600;
            border-top: 1px solid #2a2a2a; text-align: left; padding-left: 12px;
        }
        .candidates-btn:hover { color: #fff; background: #2a2a2a; }
        
        .candidates-list {
            display: none;
            background: #111;
            padding: 10px;
            border-top: 1px solid #222;
        }
        .candidate-item {
            display: flex; gap: 10px; margin-bottom: 8px; align-items: center;
            border-bottom: 1px solid #222; padding-bottom: 8px;
        }
        .candidate-item:last-child { border-bottom: none; margin-bottom: 0; }
        
        .row-kv { display: flex; justify-content: space-between; margin-top: 2px; }
        
    </style>
    <script>
        function showModel(key) {
            document.querySelectorAll('.model-container').forEach(e => e.style.display = 'none');
            document.getElementById('model-' + key).style.display = 'block';
            
            document.querySelectorAll('.nav-item').forEach(e => e.classList.remove('active'));
            document.getElementById('nav-' + key).classList.add('active');
        }
        
        function toggleCandidates(id) {
            const el = document.getElementById(id);
            el.style.display = el.style.display === 'block' ? 'none' : 'block';
        }
    </script>
</head>
<body>
<aside>
    <div class="brand">ANTIGRAVITY<br><span style="font-weight:400; font-size:0.7em; color:#666">VERIFICATION VIEWER</span></div>
    <div class="nav-list">
`;

    const sortedKeys = Object.keys(manifest).sort();

    sortedKeys.forEach((key, idx) => {
        const m = manifest[key];
        // Count High Score (>=3) OR White-listed 2s if accepted (but logic says 3)
        // User wants "Gemini verified 10/10"
        let valid = 0;
        Object.values(m.angles).forEach(slot => {
            if (slot.selected && slot.selected.score >= 3) valid++;
        });

        let dot = 'dot-red';
        if (valid === 10) dot = 'dot-green';
        else if (valid > 0) dot = 'dot-yellow';

        html += `
        <div class="nav-item ${idx === 0 ? 'active' : ''}" id="nav-${key}" onclick="showModel('${key}')">
            <div>
                <div style="font-weight:600; color:#eee;">${key}</div>
                <div class="nav-meta">${valid}/10 Verified</div>
            </div>
            <span class="status-dot ${dot}"></span>
        </div>`;
    });

    html += `</div></aside><main>`;

    sortedKeys.forEach((key, idx) => {
        const m = manifest[key];

        // Header
        let validCount = 0;
        Object.values(m.angles).forEach(s => { if (s.selected && s.selected.score >= 3) validCount++ });
        const statusColor = validCount === 10 ? '#00ff99' : (validCount > 0 ? '#ffaa00' : '#ff3333');
        const statusText = validCount === 10 ? 'VERIFIED' : 'PARTIAL / MISSING';

        html += `<div class="model-container" id="model-${key}" style="display: ${idx === 0 ? 'block' : 'none'}">
            <div class="header">
                <h1>${key}</h1>
                <div class="subtitle">
                    Status: <strong style="color:${statusColor}">${statusText}</strong> — ${validCount}/10 Valid Angles (Gemini Score >= 3)
                </div>
            </div>`;

        // Iterate Groups
        angleGroups.forEach(group => {
            html += `
            <div class="group-section">
                <div class="group-label">${group.name}</div>
                <div class="grid">`;

            group.angles.forEach(angleNum => {
                const angleKey = `angle_${String(angleNum).padStart(2, '0')}`;
                const slot = m.angles[angleKey];
                const sel = slot ? slot.selected : null;

                if (!sel) {
                    html += `
                    <div class="card missing">
                        <div style="font-weight:bold; font-size:1.2em;">MISSING</div>
                        <div style="font-family:monospace; margin-top:5px;">${angleKey}</div>
                    </div>`;
                    return;
                }

                let cardClass = 'selected-bad';
                if (sel.score >= 3) cardClass = 'selected-gemini';
                else if (sel.score === 2) cardClass = 'selected-weak';

                const relPath = path.relative('output', sel.path);

                html += `
                <div class="card ${cardClass}">
                    <div class="img-wrap"><img src="${relPath}" loading="lazy"></div>
                    <div class="meta">
                        <div class="badges">
                            <span class="badge badge-score">${sel.score} PTS</span>
                            ${sel.reasons.map(r => `<span class="badge badge-ts">${r}</span>`).join('')}
                        </div>
                        <div class="row-kv"><strong>${angleKey}</strong> <span>${(sel.size / 1024).toFixed(0)} KB</span></div>
                        <div style="font-family:monospace; color:#666; font-size:0.9em; margin-top:5px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${sel.filename}">${sel.filename}</div>
                    </div>
                    
                    ${slot.candidates.length > 1 ? `
                    <button class="candidates-btn" onclick="toggleCandidates('cand-${key}-${angleNum}')">
                        + ${slot.candidates.length - 1} Other Candidates
                    </button>
                    <div class="candidates-list" id="cand-${key}-${angleNum}">
                        ${slot.candidates.slice(1).map(c => `
                            <div class="candidate-item">
                                <span style="font-weight:bold; color:${c.score >= 3 ? '#00ff99' : '#666'}">${c.score}</span>
                                <div style="font-size:0.75em; color:#aaa; margin-left:10px;">
                                    <div>${c.folder}</div>
                                    <div>${(c.size / 1024).toFixed(0)}KB</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>` : ''}
                </div>`;
            });

            html += `</div></div>`; // End grid, End group
        });

        html += `</div>`; // End model view
    });

    html += `</main></body></html>`;

    fs.writeFileSync(VIEWER_PATH, html);
    console.log("Viewer written to " + VIEWER_PATH);
}

buildViewer();
