const fs = require('fs');
const path = require('path');

const BASE_DIR = '/Users/temiagunloye/Desktop/carguy-app/tmp/production_staging';
const OUTPUT_FILE = '/Users/temiagunloye/.gemini/antigravity/brain/23c8213d-1fa0-485f-950e-b5e69947ec56/final_fleet_production.md';

const models = [
    'mercedes_c63_2024',
    'audi_rs6_2024',
    'subaru_brz_2024',
    'bmw_m3_2024',
    'porsche_911_2024'
];

function getImages(dir) {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(f => f.match(/\.(png|jpg|jpeg)$/i))
        .sort((a, b) => { // Try to sort numerically if possible angle_01, angle_02...
            const numA = parseInt(a.replace(/\D/g, '')) || 0;
            const numB = parseInt(b.replace(/\D/g, '')) || 0;
            return numA - numB;
        });
}

let md = '# Full Fleet Render Audit\n\nReviewing all available angles for every model.\n';

models.forEach(model => {
    md += `\n## ${model.replace(/_/g, ' ').toUpperCase()}\n`;
    const dir = path.join(BASE_DIR, model);
    const images = getImages(dir);


    if (images.length === 0) {
        md += '> **⚠️ NO IMAGES FOUND**\n';
    } else {
        md += `**Found ${images.length} images.**\n\n`;
        // Add Style Reference for comparison
        if (fs.existsSync(path.join(BASE_DIR, 'STYLE_REFERENCE.jpg'))) {
            md += '### Style Reference vs Output\n';
            md += `| User Ref | Render Output (Angle 01) |\n|---|---|\n| ![Ref](${path.join(BASE_DIR, 'STYLE_REFERENCE.jpg')}) | ![Output](${path.join(dir, images[0])}) |\n\n`;
        }
        md += '````carousel\n';
        images.forEach((img, idx) => {
            const absPath = path.join(dir, img);
            md += `![${img}](${absPath})\n`;
            if (idx < images.length - 1) md += '<!-- slide -->\n';
        });
        md += '````\n';
    }
});

md += '\n---\n# Custom Builds / Variants\n';
// Find all subdirectories that are NOT in the 'models' list
const allDirs = fs.readdirSync(BASE_DIR).filter(d => fs.statSync(path.join(BASE_DIR, d)).isDirectory());
const customBuilds = allDirs.filter(d => !models.includes(d));

customBuilds.forEach(build => {
    md += `\n### ${build.replace(/_/g, ' ')}\n`;
    const dir = path.join(BASE_DIR, build);
    const images = getImages(dir);
    if (images.length === 0) {
        md += '> **⚠️ NO IMAGES FOUND (Pending Location)**\n';
    } else {
        md += `**Found ${images.length} images.**\n\n`;
        md += '````carousel\n';
        images.forEach((img, idx) => {
            const absPath = path.join(dir, img);
            md += `![${img}](${absPath})\n`;
            if (idx < images.length - 1) md += '<!-- slide -->\n';
        });
        md += '````\n';
    }
});

fs.writeFileSync(OUTPUT_FILE, md);
console.log('Gallery generated at:', OUTPUT_FILE);
