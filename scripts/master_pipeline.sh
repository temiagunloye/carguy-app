#!/bin/bash
set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CANONICAL="$REPO_ROOT/assets/cars"
OUTPUT_DIR="$REPO_ROOT/output/pipeline"
EXPECTED_BUILDS="$CANONICAL/expected_builds.json"
ALIAS_MAP="$CANONICAL/alias_map.json"

mkdir -p "$OUTPUT_DIR"

cmd_serve_fix() {
    echo "🔗 Setting up canonical asset serving..."
    
    WEB_ASSETS="$REPO_ROOT/website/assets"
    
    if [ -L "$WEB_ASSETS" ]; then
        TARGET=$(readlink "$WEB_ASSETS")
        if [ "$TARGET" = "../assets" ]; then
            echo "  ✓ Symlink correct"
            return 0
        fi
    fi
    
    if [ -d "$WEB_ASSETS" ] && [ ! -L "$WEB_ASSETS" ]; then
        echo "  ⚠️  Backing up existing website/assets"
        mv "$WEB_ASSETS" "$WEB_ASSETS.bak"
    elif [ -L "$WEB_ASSETS" ]; then
        rm "$WEB_ASSETS"
    fi
    
    ln -s ../assets "$WEB_ASSETS"
    echo "  ✓ Created symlink: website/assets -> ../assets"
    echo "✅ Serve fix complete"
}

cmd_reconcile_aliases() {
    echo "🔄 Reconciling aliases..."
    
    if [ ! -f "$ALIAS_MAP" ]; then
        echo "  ⏭️  No alias_map.json"
        return 0
    fi
    
    node -e "
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const aliasMap = JSON.parse(fs.readFileSync('$ALIAS_MAP', 'utf8'));
let processed = 0;

Object.entries(aliasMap).forEach(([legacy, expected]) => {
    const legacyPath = path.join('$CANONICAL', legacy);
    const expectedPath = path.join('$CANONICAL', expected);
    
    if (!fs.existsSync(legacyPath)) {
        return;
    }
    
    console.log(\`  🔀 \${legacy} -> \${expected}\`);
    
    fs.mkdirSync(expectedPath, { recursive: true });
    
    const files = fs.readdirSync(legacyPath);
    files.forEach(file => {
        const src = path.join(legacyPath, file);
        const dest = path.join(expectedPath, file);
        if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
            fs.renameSync(src, dest);
        }
    });
    
    try { fs.rmdirSync(legacyPath); } catch { execSync(\`rm -rf \"\${legacyPath}\"\`); }
    processed++;
});

console.log(\`✅ Reconciled \${processed} aliases\`);
"
}

cmd_normalize_angles() {
    echo "📐 Normalizing angle filenames..."
    
    node -e "
const fs = require('fs');
const path = require('path');

const map_angle = (basename) => {
    const b = basename.toLowerCase();
    if (/driver.*front.*3/.test(b) || /front.*3.*driver/.test(b)) return '01';
    if (/passenger.*front.*3/.test(b) || /front.*3.*passenger/.test(b)) return '02';
    if (/driver.*side/.test(b) || /side.*driver/.test(b)) return '03';
    if (/passenger.*side/.test(b) || /side.*passenger/.test(b)) return '04';
    if (/driver.*rear.*3/.test(b) || /rear.*3.*driver/.test(b)) return '05';
    if (/passenger.*rear.*3/.test(b) || /rear.*3.*passenger/.test(b)) return '06';
    if (/front.*center/.test(b) || /center.*front/.test(b)) return '07';
    if (/rear.*center/.test(b) || /center.*rear/.test(b)) return '08';
    if (/high.*front/.test(b)) return '09';
    if (/high.*rear/.test(b)) return '10';
    return null;
};

const builds = fs.readdirSync('$CANONICAL').filter(f => 
    fs.statSync(path.join('$CANONICAL', f)).isDirectory()
);

let normalized = 0;

builds.forEach(buildId => {
    const buildPath = path.join('$CANONICAL', buildId);
    
    const hasAll = Array.from({length: 10}, (_, i) => {
        const angle = \`angle_\${(i+1).toString().padStart(2, '0')}.png\`;
        return fs.existsSync(path.join(buildPath, angle));
    }).every(x => x);
    
    if (hasAll) return;
    
    const files = fs.readdirSync(buildPath)
        .filter(f => /\.(png|jpg|webp)$/i.test(f))
        .map(f => ({
            name: f,
            path: path.join(buildPath, f),
            mtime: fs.statSync(path.join(buildPath, f)).mtime
        }));
    
    const mapped = new Map();
    
    files.forEach(file => {
        const angleNum = map_angle(file.name);
        if (angleNum && !mapped.has(angleNum)) {
            mapped.set(angleNum, file);
        }
    });
    
    if (mapped.size === 0 && files.length >= 10) {
        files.sort((a, b) => b.mtime - a.mtime);
        files.slice(0, 10).forEach((file, i) => {
            const angleNum = (i + 1).toString().padStart(2, '0');
            mapped.set(angleNum, file);
        });
    }
    
    mapped.forEach((file, angleNum) => {
        const dest = path.join(buildPath, \`angle_\${angleNum}.png\`);
        if (!fs.existsSync(dest) && file.path !== dest) {
            fs.renameSync(file.path, dest);
            normalized++;
        }
    });
});

console.log(\`✅ Normalized \${normalized} files\`);
"
}

cmd_validate() {
    echo "✔️  Validating expected builds..."
    
    cmd_reconcile_aliases
    cmd_normalize_angles
    
   if [ ! -f "$EXPECTED_BUILDS" ]; then
        echo "❌ expected_builds.json not found"
        exit 1
    fi
    
    node -e "
const fs = require('fs');
const path = require('path');

const expected = JSON.parse(fs.readFileSync('$EXPECTED_BUILDS', 'utf8'));
const results = {};

expected.forEach(buildId => {
    const buildPath = path.join('$CANONICAL', buildId);
    
    if (!fs.existsSync(buildPath)) {
        fs.mkdirSync(buildPath, { recursive: true });
    }
    
    const angles = [];
    const missing = [];
    
    for (let i = 1; i <= 10; i++) {
        const angle = 'angle_' + i.toString().padStart(2, '0');
        const anglePath = path.join(buildPath, angle + '.png');
        
        if (fs.existsSync(anglePath)) {
            angles.push(angle);
        } else {
            missing.push(angle);
        }
    }
    
    results[buildId] = {
        complete: angles.length === 10,
        count: angles.length,
        missing
    };
});

fs.writeFileSync('$OUTPUT_DIR/validate.json', JSON.stringify(results, null, 2));
console.log(\`✅ Validated \${Object.keys(results).length} builds\`);
"
}

cmd_index() {
    echo "📇 Generating indices..."
    
    node -e "
const fs = require('fs');
const path = require('path');

const validate = JSON.parse(fs.readFileSync('$OUTPUT_DIR/validate.json', 'utf8'));
const completed = {};
const all = {};

Object.entries(validate).forEach(([buildId, data]) => {
    const buildPath = path.join('$CANONICAL', buildId);
    let updatedAt = new Date().toISOString();
    
    try {
        updatedAt = fs.statSync(buildPath).mtime.toISOString();
    } catch {}
    
    const entry = {
        buildId,
        complete: data.complete,
        availableAngles: data.count,
        missingAngles: data.missing,
        updatedAt
    };
    
    all[buildId] = entry;
    if (data.complete) {
        completed[buildId] = entry;
    }
});

fs.writeFileSync('$CANONICAL/index.json', JSON.stringify(completed, null, 2));
fs.writeFileSync('$CANONICAL/index_all.json', JSON.stringify(all, null, 2));

console.log(\`✅ Index: \${Object.keys(completed).length}/\${Object.keys(all).length} complete\`);
"
}

cmd_checklist() {
    echo "📋 Generating checklist..."
    
    node -e "
const fs = require('fs');

const validate = JSON.parse(fs.readFileSync('$OUTPUT_DIR/validate.json', 'utf8'));
const completed = [];
const partial = [];
const missing = [];

Object.entries(validate).forEach(([buildId, data]) => {
    if (data.complete) {
        completed.push(buildId);
    } else if (data.count > 0) {
        partial.push({ buildId, count: data.count, missing: data.missing });
    } else {
        missing.push(buildId);
    }
});

let md = '# Render Pipeline Checklist\n\n';
md += \`Generated: \${new Date().toISOString()}\n\n\`;
md += \`## ✅ Completed (10/10) — \${completed.length}\n\n\`;
completed.forEach(id => md += \`- \${id}\n\`);

md += \`\n## ⚠️ Partial — \${partial.length}\n\n\`;
partial.forEach(p => {
    md += \`- **\${p.buildId}** (\${p.count}/10)\n\`;
    md += \`  Missing: \${p.missing.join(', ')}\n\`;
});

md += \`\n## ❌ Missing — \${missing.length}\n\n\`;
missing.forEach(id => md += \`- \${id}\n\`);

fs.writeFileSync('$OUTPUT_DIR/checklist.md', md);
console.log(md);
" | tee "$OUTPUT_DIR/checklist.md"
}

cmd_render_queue() {
    echo "🎨 Building render queue..."
    node "$REPO_ROOT/scripts/build_render_queue.js"
}

case "${1:-help}" in
    serve-fix) cmd_serve_fix ;;
    reconcile-aliases) cmd_reconcile_aliases ;;
    normalize-angles) cmd_normalize_angles ;;
    validate) cmd_validate ;;
    index) cmd_index ;;
    checklist) cmd_checklist ;;
    render-queue) cmd_render_queue ;;
    *)
        echo "Usage: $0 {serve-fix|reconcile-aliases|normalize-angles|validate|index|checklist|render-queue}"
        exit 1
        ;;
esac
