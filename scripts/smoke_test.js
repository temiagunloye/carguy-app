const fs = require('fs');
const path = require('path');

const REQUIRED_ROUTES = {
    'garage-manager': [
        '/index.html', // for /
        '/partner/dashboard.html', // Updated from /shop to /partner
        '/partner/builds.html',
        '/partner/quotes.html', // This might be simulator.html?
        '/partner/inventory/new.html', // This might be inventory-add.html?
    ],
    'thatappcompany': [
        '/src/app/page.tsx', // for /
        '/src/app/dashboard/page.tsx', // Assumed structure
    ]
};

const WEB_ROOT = path.join(__dirname, '../website');

async function checkRoutes() {
    console.log('--- STARTING SMOKE TEST ---');
    let errors = 0;

    // Check GarageManager Routes (File System)
    const gmRoutes = [
        { route: '/', file: 'index.html' },
        { route: '/partner', file: 'partner/index.html' }, // Assuming index or dashboard
        { route: '/partner/builds', file: 'partner/builds.html' },
        { route: '/partner/quotes', file: 'partner/quotes.html' },
        { route: '/partner/inventory', file: 'partner/inventory.html' },
        { route: '/partner/inventory/new', file: 'partner/inventory-add.html' },
        { route: '/partner/simulator', file: 'partner/simulator.html' },
        { route: '/app', file: 'app/index.html' },
    ];

    for (const r of gmRoutes) {
        // Check both file and file/index.html
        const filePath = path.join(WEB_ROOT, r.file);
        if (!fs.existsSync(filePath)) {
            // Try alternative logic? 
            // For now, fail.
            console.error(`[FAIL] Missing file for route ${r.route}: ${r.file}`);
            errors++;
        } else {
            console.log(`[PASS] ${r.route} -> ${r.file}`);
        }
    }

    if (errors > 0) {
        console.log(`\nFound ${errors} missing routes/files.`);
        process.exit(1);
    } else {
        console.log('\nAll routes verified.');
    }
}

checkRoutes();
