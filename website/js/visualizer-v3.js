/*
CANONICAL RENDER CONTRACT
- ONLY source: /assets/cars/<buildId>/angle_01..angle_10.png
- NO manifest.json (never)
- NO fallback to currentCar.renderUrls (never)
- Missing angles => Render Pending (blank)
- currentBuildId is the single source of truth
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { collection, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { attachSpinController } from './spin360.js';

// Public Config (No Auth Required for Reads)
const firebaseConfig = {
    apiKey: "AIzaSyCEFvcV4MKlxtXOiZXRFTL8xVSGuKsPme8",
    authDomain: "carguy-app-demo.firebaseapp.com",
    projectId: "carguy-app-demo",
    storageBucket: "carguy-app-demo.firebasestorage.app",
    messagingSenderId: "869343833766",
    appId: "1:869343833766:web:d80b4034b146525a588e67"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// NOTE: We do NOT initialize Auth here. This prevents the domain check.

// Default stock builds mapping
const DEFAULT_STOCK_BUILDS = {
    'audi_rs6': 'audi_rs6_stock_grey',
    'bmw_m3': 'bmw_m3_stock_white',
    'mercedes_c63': 'c63_stock_black',
    'subaru_brz': 'brz_stock_blue',
    'porsche_911': 'porsche_911_stock',
    'porsche_gt3': 'porsche_gt3_stock_red'
};

// Data State
let standardCars = [];
let builds = [];
let wheels = [];
let wraps = [];
let paints = [];
let parts = [];
let approvedRenders = [];
let currentCar = null;
let currentBuild = null;
let currentBuildId = null;
let selections = {
    wrapId: null,
    wheelId: null,
    partId: null
};
let currentManifest = null;
let currentAngleIndex = 0;
let renderPendingActive = false;
let preloadedImages = {}; // Cache for instant rotation

// Order matches the App's camera sequence for dots
// (Or just a logical walkaround)
const ANGLE_KEYS = [
    'driver_front', 'passenger_front', // Front Corners
    'full_driver_side', 'full_passenger_side', // Sides
    'driver_rear', 'passenger_rear', // Rear Corners
    'front_center', 'rear_center', // Centers
    'front_low', 'rear_low' // Lows
];

// Elements
const els = {
    select: document.getElementById('vehicle-selector'),
    img: document.getElementById('main-vehicle-image'),
    dots: document.querySelectorAll('.angle-dot'),
    summaryName: document.getElementById('summary-vehicle-name'),

};

async function init() {
    console.log("Starting Shop Visualizer... v3.0 (Full Roster Restoration)");


    try {
        // 1. Fetch Data in Parallel (INCLUDING approvedRenders for enforcement)
        const [carsSnap, wheelsSnap, wrapsSnap, buildsSnap, approvedSnap] = await Promise.all([
            getDocs(collection(db, "baseModels")),
            getDocs(collection(db, "wheels")),
            getDocs(collection(db, "wraps")),
            getDocs(collection(db, "builds")),
            getDocs(collection(db, "approvedRenders"))
        ]);

        let remoteCars = carsSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(c => c.active !== false);
        const wheelsData = wheelsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const wrapsData = wrapsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const buildsData = buildsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const approvedData = approvedSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Assign to module-level variables
        wheels = wheelsData;
        wraps = wrapsData;
        paints = wrapsData; // Alias for compatibility
        approvedRenders = approvedData;

        // --- CANONICAL BASE MODELS & BUILDS ---
        const baseModels = [
            { id: 'audi_rs6', displayName: 'Audi RS6 Avant' },
            { id: 'bmw_m3', displayName: 'BMW M3 Competition' },
            { id: 'mercedes_c63', displayName: 'Mercedes-AMG C63' },
            { id: 'subaru_brz', displayName: 'Subaru BRZ' },
            { id: 'porsche_911', displayName: 'Porsche 911' },
            { id: 'porsche_gt3', displayName: 'Porsche 911 GT3' }
        ];

        // Load builds from base_to_builds_map.json
        let baseToBuildsMap = {};
        try {
            const mapResp = await fetch('/assets/cars/base_to_builds_map.json');
            baseToBuildsMap = await mapResp.json();
        } catch (err) {
            console.warn('Could not load base_to_builds_map.json:', err);
        }

        // Flatten all builds with metadata
        const customBuilds = [];
        Object.entries(baseToBuildsMap).forEach(([baseId, buildIds]) => {
            buildIds.forEach(buildId => {
                customBuilds.push({
                    id: buildId,
                    baseId,
                    thumbnail: `/assets/cars/${buildId}/angle_01.png`,
                    renderUrls: Array.from({ length: 10 }).reduce((acc, _, i) => {
                        const angle = `angle_${(i + 1).toString().padStart(2, '0')}`;
                        acc[angle] = `/assets/cars/${buildId}/${angle}.png`;
                        return acc;
                    }, {})
                });
            });
        });

        standardCars = baseModels;
        builds = customBuilds;

        // 2. Populate Vehicle Dropdown
        els.select.innerHTML = '<option value="" disabled selected>Select Base Car...</option>';
        standardCars.forEach(car => {
            const opt = document.createElement('option');
            opt.value = car.id;
            opt.innerText = car.displayName;
            els.select.appendChild(opt);
        });

        els.select.onchange = (e) => loadCar(e.target.value);

        // 3. Setup Angle Nav
        els.dots.forEach((dot, idx) => {
            dot.onclick = () => setAngle(idx);
        });

        // Default Load
        const params = new URLSearchParams(window.location.search);
        let targetBaseId = params.get('carId') || 'bmw_m3';
        els.select.value = targetBaseId;
        loadCar(targetBaseId);

        // 4. Initialize 360 Spin Controller
        attachSpinController({
            imgEl: els.img,
            setAngleFn: setAngle,
            getAngleIndexFn: () => currentAngleIndex,
            isRenderPendingFn: () => renderPendingActive,
            frameCount: 10,
            debug: new URLSearchParams(window.location.search).get('debug') === '1'
        });

    } catch (e) {
        console.warn("Init Warning:", e);
    }
}

let currentBaseId = null;

function loadCar(baseId) {
    currentBaseId = baseId;
    currentCar = standardCars.find(c => c.id === baseId);
    if (!currentCar) return;

    // Reset State
    selections = { wrapId: null, wheelId: null, partId: null };
    currentBuild = null;
    currentManifest = null;

    // Set default stock buildId for this base
    currentBuildId = DEFAULT_STOCK_BUILDS[baseId] || null;

    if (els.summaryName) {
        els.summaryName.innerText = currentCar.displayName;
    }

    renderSelectors();
    populateBuildsTab(baseId);
    setAngle(0);
}

function renderSelectors() {
    // 1. Paint Options Grid (Card-based like Builds)
    populatePaintOptionsGrid();

    // 2. Parts Options Grid (Card-based like Builds)
    populatePartsOptionsGrid();
}

function populatePaintOptionsGrid() {
    const wrapGrid = document.getElementById('wrap-selector');
    if (!wrapGrid) return;

    wrapGrid.innerHTML = '';

    paints.forEach(paint => {
        const card = createOptionCard(paint, 'wrapId');
        wrapGrid.appendChild(card);
    });
}

function populatePartsOptionsGrid() {
    const partsGrid = document.getElementById('parts-list');
    const wheelsGrid = document.getElementById('wheels-selector');
    if (!partsGrid && !wheelsGrid) return;

    if (partsGrid) {
        partsGrid.innerHTML = '';
        parts.forEach(part => {
            partsGrid.appendChild(createOptionCard(part, 'partId'));
        });
    }

    if (wheelsGrid) {
        wheelsGrid.innerHTML = '';
        wheels.forEach(wheel => {
            wheelsGrid.appendChild(createOptionCard(wheel, 'wheelId'));
        });
    }
}

function createOptionCard(option, stateKey) {
    const card = document.createElement('div');
    card.className = 'build-item'; // Reuse build-item styling for consistency
    if (selections[stateKey] === option.id) card.classList.add('active');

    const img = document.createElement('img');
    img.src = option.thumbnailUrl || '/assets/ui/placeholder.png';
    img.alt = option.name;

    const span = document.createElement('span');
    span.innerHTML = `<strong>${option.brand}</strong><br>${option.name}`;

    // Credit Link (Small/Subtle)
    if (option.creditUrl) {
        const credit = document.createElement('a');
        credit.href = option.creditUrl;
        credit.target = '_blank';
        credit.className = 'card-credit-link';
        credit.innerText = 'Photo Credit';
        credit.onclick = (e) => e.stopPropagation();
        card.appendChild(credit);
    }

    card.appendChild(img);
    card.appendChild(span);

    card.onclick = () => {
        // Clear conflicting selections if needed, or just apply
        selections[stateKey] = option.id;

        // When clicking a PAINT/WHEEL/PART, we clear the BUILDS selection to prioritize the custom config
        if (stateKey !== 'buildId') currentBuild = null;

        updateVisualizer();
        renderSelectors(); // Refresh active states
    };

    return card;
}

function createWheelOptionItem(id, name, isActive = false) {
    const div = document.createElement('div');
    div.className = `wheel-option-item ${isActive ? 'active' : ''}`;
    div.innerHTML = `<span>${name}</span>`;
    div.onclick = () => {
        document.querySelectorAll('.wheel-option-item').forEach(el => el.classList.remove('active'));
        div.classList.add('active');
        window.selectWheel(id);
    };
    return div;
}



window.switchTab = function (tabId) {
    // 1. Toggle Tab Buttons
    document.querySelectorAll('.config-tab').forEach(tab => {
        const isActive = tab.getAttribute('onclick').includes(`'${tabId}'`);
        tab.classList.toggle('active', isActive);
    });

    // 2. Toggle Content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${tabId}`);
    });
}

function createWheelOption(id, name, isActive = false) {
    const div = document.createElement('div');
    div.className = 'part-toggle-item';
    div.innerHTML = `
        <span>${name}</span>
        <input type="radio" name="wheel-selection" ${isActive ? 'checked' : ''} onchange="window.selectWheel('${id}')">
    `;
    return div;
}

// Preload car angles into browser cache for instant rotation
function preloadCarAngles() {
    if (!currentBuildId) return;

    console.log(`🔄 Preloading angles for ${currentBuildId}...`);

    // Preload all 10 angles for current buildId
    const imgVersion = new URLSearchParams(window.location.search).get("imgv") || "CANONICAL_V103";
    for (let i = 1; i <= 10; i++) {
        const angleKey = `angle_${i.toString().padStart(2, '0')}`;
        const url = `/assets/cars/${currentBuildId}/${angleKey}.png?v=${imgVersion}`;
        const img = new Image();
        img.src = url; // Browser will cache
    }
}

// Manifest Loader
const manifestCache = {};
async function fetchManifest(url) {
    if (manifestCache[url]) return manifestCache[url];
    try {
        const res = await fetch(url);
        const data = await res.json();
        manifestCache[url] = data;
        return data;
    } catch (e) {
        console.error("Manifest Load Failed:", e);
        return null;
    }
}

function setAngle(index) {
    if (!currentCar && !currentBuild && !currentBuildId) return;

    // Bounds check
    if (index < 0) index = 0;
    if (index >= 10) index = 9;

    // Update Dots UI
    els.dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
    });

    const angleKey = `angle_${(index + 1) < 10 ? '0' + (index + 1) : (index + 1)}`;
    let url = null;

    // Priority 1: currentBuild (explicit build selection from Builds tab)
    if (currentBuild && currentBuild.renderUrls) {
        url = currentBuild.renderUrls[angleKey];
    }
    // Priority 2: currentBuildId (stock default or resolved from selections)
    else if (currentBuildId) {
        // Cache Busting: Use ?imgv= param from URL or default
        const imgVersion = new URLSearchParams(window.location.search).get("imgv") || "CANONICAL_V103";
        url = `/assets/cars/${currentBuildId}/${angleKey}.png?v=${imgVersion}`;
    }

    // If we have a URL, load it. Otherwise show Render Pending
    if (url) {
        showRenderPending(false);
        els.img.style.opacity = '1';

        // HARD 404 HANDLING: clear old image and show pending if new fails
        els.img.onerror = () => {
            console.warn('[404] Image failed to load:', url);
            showRenderPending(true);
            els.img.style.opacity = '0.3';
            els.img.src = ''; // CRITICAL: clear old image
        };

        els.img.src = url;
    } else {
        showRenderPending(true);
        els.img.style.opacity = '0.3';
        els.img.src = '';
    }

    currentAngleIndex = index;
    updateDebugHUD();
}


function showRenderPending(show) {
    let overlay = document.getElementById('render-pending-overlay');

    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'render-pending-overlay';
        overlay.innerHTML = `
            <div class="pending-content">
                <i data-lucide="clock" style="width:48px;height:48px;margin-bottom:16px;"></i>
                <h2>Render Pending</h2>
                <p>A high-quality 360-degree render for this configuration is currently being generated.</p>
            </div>
        `;
        // Append to viewer canvas
        const container = document.querySelector('.viewer-canvas');
        if (container) container.appendChild(overlay);
        lucide.createIcons();
    }

    overlay.style.display = show ? 'flex' : 'none';
    renderPendingActive = show;
}

// Global scope for onclicks in HTML (if any remain)
window.setAngle = setAngle;

window.selectWrap = function (id) {
    console.log(`Selected Wrap: ${id}`);
    selections.wrapId = (id === 'factory') ? null : id;

    // Update UI
    const swatches = document.querySelectorAll('.color-swatch');
    swatches.forEach(s => s.classList.remove('active'));
    // Find correctly (naive match by title or data-id if we added it)
    // Actually simpler to just redo selection in updateVisualizer

    updateVisualizer();
}

window.selectWheel = function (id) {
    console.log(`Selected Wheel: ${id}`);
    selections.wheelId = (id === 'stock') ? null : id;
    updateVisualizer();
}

window.updateVisualizer = async function () {
    console.log("Updating Visualizer Configuration...", selections);

    // 1. Resolve Render Source
    // Priority: Explicit Build (from BUILDS tab) > Wheel Render > Part Render > Paint Render > Stock
    let resolvedRenderKey = null;

    if (!currentBuild) {
        // Find if current selections have a render key for this car
        const wheelOpt = wheels.find(w => w.id === selections.wheelId);
        const partOpt = parts.find(p => p.id === selections.partId);
        const paintOpt = paints.find(p => p.id === selections.wrapId);

        if (wheelOpt && wheelOpt.renderKeyByVehicle && wheelOpt.renderKeyByVehicle[currentCar.id]) {
            resolvedRenderKey = wheelOpt.renderKeyByVehicle[currentCar.id];
        } else if (partOpt && partOpt.renderKeyByVehicle && partOpt.renderKeyByVehicle[currentCar.id]) {
            resolvedRenderKey = partOpt.renderKeyByVehicle[currentCar.id];
        } else if (paintOpt && paintOpt.renderKeyByVehicle && paintOpt.renderKeyByVehicle[currentCar.id]) {
            resolvedRenderKey = paintOpt.renderKeyByVehicle[currentCar.id];
        }

        if (resolvedRenderKey) {
            currentBuild = {
                id: 'resolved_' + resolvedRenderKey,
                renderUrls: Array.from({ length: 10 }).reduce((acc, _, i) => {
                    const angle = `angle_${(i + 1) < 10 ? '0' + (i + 1) : (i + 1)}`;
                    acc[angle] = `/assets/cars/${resolvedRenderKey}/${angle}.png`;
                    return acc;
                }, {})
            };
        }
    }

    // 2. Clear "Render Pending" overlay
    const overlay = document.getElementById('render-pending-overlay');
    if (overlay) overlay.style.display = 'none';

    // 3. Update Summary Panel
    const wrapEl = document.getElementById('summary-wrap');
    if (wrapEl) {
        const wrap = paints.find(w => w.id === selections.wrapId);
        wrapEl.innerText = wrap ? wrap.name : 'Factory';
    }

    const countEl = document.getElementById('summary-parts-count');
    if (countEl) {
        const wheel = wheels.find(w => w.id === selections.wheelId);
        countEl.innerText = wheel ? wheel.brand + ' ' + wheel.name : 'Stock';
    }

    // 4. Update View
    setAngle(currentAngleIndex);
}

function populateBuildsTab(baseId) {
    const gallery = document.getElementById('builds-gallery');
    if (!gallery) return;

    gallery.innerHTML = '';

    // Find builds related to this baseId
    const relatedBuilds = builds.filter(b => b.baseId === baseId);

    if (relatedBuilds.length === 0) {
        gallery.innerHTML = '<div class="no-builds">No custom builds found for this model yet.</div>';
        return;
    }

    relatedBuilds.forEach(build => {
        const div = document.createElement('div');
        div.className = 'build-item';
        div.onclick = () => {
            console.log('[BUILD CLICK]', {
                baseId,
                buildId: build.id,
                label: build.name || build.id,
                resolvedBuildId: build.id
            });
            loadCustomBuild(build.id);
        };

        const img = document.createElement('img');
        img.src = build.thumbnail || build.renderUrls.angle_01 || build.renderUrls.driver_front || '';
        img.alt = build.name;

        const span = document.createElement('span');
        span.innerText = build.name || build.id.replace(/_/g, ' ').toUpperCase();

        div.appendChild(img);
        div.appendChild(span);
        gallery.appendChild(div);
    });
}

function loadCustomBuild(buildId) {
    const build = builds.find(b => b.id === buildId);
    if (!build) return;

    currentBuild = build;
    currentBuildId = build.id; // CRITICAL: set currentBuildId

    // Apply specific selections implied by this build (optional, but helps UI sync)
    if (build.wrapId) selections.wrapId = build.wrapId;
    if (build.wheelId) selections.wheelId = build.wheelId;

    // Refresh UI
    renderSelectors();
    preloadCarAngles();
    setAngle(0);
    updateDebugHUD();
}

window.nextAngle = function () {
    let newIndex = currentAngleIndex + 1;
    if (newIndex >= ANGLE_KEYS.length) newIndex = 0;
    setAngle(newIndex);
}

window.prevAngle = function () {
    let newIndex = currentAngleIndex - 1;
    if (newIndex < 0) newIndex = ANGLE_KEYS.length - 1;
    setAngle(newIndex);
}

window.setBackground = function (mode) {
    const center = document.querySelector('.hud-center');
    const btns = document.querySelectorAll('.bg-toggle-group button');

    // UI State
    btns.forEach(b => b.classList.remove('active'));
    document.getElementById(`bg-btn-${mode}`)?.classList.add('active');

    // Visual State
    if (mode === 'light') {
        center.style.background = "radial-gradient(circle at center, #f4f4f5 0%, #e4e4e7 100%)";
        center.style.color = "#000"; // Invert text if needed?
    } else {
        center.style.background = "radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)";
        center.style.color = "#fff";
    }

    console.log(`Environment changed to ${mode}`);
}

// Button Handlers
window.saveLocalBuild = function () {
    if (!currentCar) return alert("Please select a vehicle first.");

    const buildData = {
        id: Date.now().toString(),
        carId: currentCar.id,
        carName: currentCar.displayName || currentCar.id,
        wrapId: selections.wrapId,
        wheelId: selections.wheelId,
        date: new Date().toLocaleDateString(),
        status: 'Draft',
        cost: Math.floor(Math.random() * 5000) + 2000 // Mock cost
    };

    const saved = JSON.parse(localStorage.getItem('partner_builds') || '[]');
    saved.push(buildData);
    localStorage.setItem('partner_builds', JSON.stringify(saved));

    // Update UI
    const statusEl = document.getElementById('save-status');
    if (statusEl) {
        statusEl.style.opacity = '1';
        setTimeout(() => statusEl.style.opacity = '0', 2000);
    }

    renderLocalBuilds();
};

window.generateShareLink = function () {
    if (!currentCar) return;
    alert("Share link copied to clipboard! (Mock)");
};

window.clearBuild = function () {
    selections = { wrapId: null, wheelId: null };
    currentBuild = null;
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    renderSelectors();
    updateVisualizer();
};

function renderLocalBuilds() {
    const list = document.getElementById('local-builds-list');
    if (!list) return;

    const saved = JSON.parse(localStorage.getItem('partner_builds') || '[]');
    if (saved.length === 0) {
        list.innerHTML = '<p>No saved builds</p>';
        return;
    }

    list.innerHTML = saved.slice(-5).reverse().map(b => `
        <div style="margin-bottom:8px; padding:8px; background:rgba(255,255,255,0.05); border-radius:4px;">
            <div style="font-weight:bold;">${b.carName}</div>
            <div style="font-size:10px;">${b.date} • ${b.status}</div>
        </div>
    `).join('');
}

// Init local builds on load
document.addEventListener('DOMContentLoaded', renderLocalBuilds);

// Debug HUD (only visible with ?debug=1)
function updateDebugHUD() {
    if (!location.search.includes('debug=1')) return;

    let hud = document.getElementById('debug-hud');
    if (!hud) {
        hud = document.createElement('div');
        hud.id = 'debug-hud';
        hud.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0,0,0,0.9);
            color: #0f0;
            padding: 10px;
            font-family: monospace;
            font-size: 11px;
            border: 1px solid #0f0;
            z-index: 99999;
            max-width: 300px;
            word-break: break-all;
        `;
        document.body.appendChild(hud);
    }

    hud.innerHTML = `
        <div><strong>BASE:</strong> ${currentBaseId || 'null'}</div>
        <div><strong>BUILD ID:</strong> ${currentBuildId || 'null'}</div>
        <div><strong>BUILD OBJ:</strong> ${currentBuild?.id || 'null'}</div>
        <div><strong>IMG SRC:</strong> ${els.img?.src?.split('/').slice(-3).join('/') || 'null'}</div>
        <div><strong>ANGLE:</strong> ${currentAngleIndex + 1}/10</div>
    `;
}

// Boot
init();
updateDebugHUD();
