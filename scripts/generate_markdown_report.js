const fs = require('fs');
const path = require('path');

const MANIFEST_PATH = 'output/provenance_manifest.json';
const REPORT_PATH = 'output/FINAL_VERIFICATION_REPORT.md';

function buildReport() {
    if (!fs.existsSync(MANIFEST_PATH)) {
        console.error("Manifest not found!");
        return;
    }

    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
    const sortedKeys = Object.keys(manifest).sort();

    let md = `# Final Gemini Verification Report (Fixed Paths)\n\n`;
    md += `**Status Summary:**\n`;

    // Summary Top
    sortedKeys.forEach(key => {
        const m = manifest[key];
        let valid = 0;
        Object.values(m.angles).forEach(s => { if (s.selected && s.selected.score >= 3) valid++ });
        // BRZ Custom Exception: If Valid=0 but it has candidates, mark as partial?
        // User wants to SEE them.

        const icon = valid === 10 ? '✅' : (valid > 0 ? '⚠️' : '❌');
        md += `- ${icon} **${key}**: ${valid}/10\n`;
    });

    md += `\n---\n`;

    sortedKeys.forEach(key => {
        const m = manifest[key];
        let valid = 0;
        Object.values(m.angles).forEach(s => { if (s.selected && s.selected.score >= 3) valid++ });

        md += `\n## ${key} (${valid}/10)\n`;

        // Helper to get image link or "MISSING"
        const getImg = (angleNum, title) => {
            const k = `angle_${String(angleNum).padStart(2, '0')}`;
            const sel = m.angles[k]?.selected;

            if (sel) {
                // Determine Verified State
                const passed = sel.score >= 3;
                const mark = passed ? '' : '⚠️ ';
                const sizeKB = Math.round(sel.size / 1024);

                // Use absolute file URI for local preview compatibility
                const absPath = path.resolve(sel.path);
                const fileUri = `file://${absPath}`;

                return `![${k}](${fileUri})<br>**${mark}Angle ${String(angleNum).padStart(2, '0')} (${title})**<br>_${sel.filename}_ (${sizeKB}KB)<br>[${sel.score} PTS]`;
            } else {
                return `❌ **MISSING**<br>Angle ${String(angleNum).padStart(2, '0')}`;
            }
        };

        // Table 1: Front | Front Side | Rear Side
        md += `### Views Set A\n`;
        md += `| Front (05) | Front Side (01) | Rear Side (03) |\n`;
        md += `| :---: | :---: | :---: |\n`;
        md += `| ${getImg(5, 'Front')} | ${getImg(1, 'Driver Front')} | ${getImg(3, 'Driver Rear')} |\n\n`;

        // Table 2: Rear | Rear Side | Front Side
        md += `### Views Set B\n`;
        md += `| Rear (06) | Rear Side (04) | Front Side (02) |\n`;
        md += `| :---: | :---: | :---: |\n`;
        md += `| ${getImg(6, 'Rear')} | ${getImg(4, 'Pass. Rear')} | ${getImg(2, 'Pass. Front')} |\n\n`;

        // Table 3: Profile | Profile | Low
        md += `### Profile & Details\n`;
        md += `| Profile (Driver 07) | Profile (Pass 08) | Low Angles (09/10) |\n`;
        md += `| :---: | :---: | :---: |\n`;
        md += `| ${getImg(7, 'Side')} | ${getImg(8, 'Side')} | ${getImg(9, 'Front Low')}<br><hr><br>${getImg(10, 'Rear Low')} |\n\n`;

        md += `\n---\n`;
    });

    fs.writeFileSync(REPORT_PATH, md);
    console.log("Report written to " + REPORT_PATH);
}

buildReport();
