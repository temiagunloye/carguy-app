import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { collection, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Data State
let standardCars = [];
let wheels = [];
let wraps = [];
let builds = []; // Full car builds (10 angles each)
let approvedRenders = []; // CURATED BUILDS ONLY - prevents stock photo fallback
let currentCar = null;
let currentBuild = null;
let selections = {
    wrapId: null,
    wheelId: null
};
let currentManifest = null;
let currentAngleIndex = 0;
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
        wheels = wheelsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        wraps = wrapsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        builds = buildsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        approvedRenders = approvedSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // --- HARDCODED WEBSITE MODELS (LOCAL OVERRIDE) ---
        // Final Master List: Stable 5 + 6 Custom Builds
        // --- HARDCODED WEBSITE MODELS (LOCAL OVERRIDE) ---
        // STRUCTURE: Base Models (Stock) -> Custom Builds (Linked by baseId)

        const baseModels = [
            {
                id: 'audi_rs6_stock',
                displayName: 'Audi RS6 Avant (Stock)',
                renderUrls: {
                    angle_01: '/assets/cars/audi_rs6_stock/angle_01.png',
                    angle_02: '/assets/cars/audi_rs6_stock/angle_02.png',
                    angle_03: '/assets/cars/audi_rs6_stock/angle_03.png',
                    angle_04: '/assets/cars/audi_rs6_stock/angle_04.png',
                    angle_05: '/assets/cars/audi_rs6_stock/angle_05.png',
                    angle_06: '/assets/cars/audi_rs6_stock/angle_06.png',
                    angle_07: '/assets/cars/audi_rs6_stock/angle_07.png',
                    angle_08: '/assets/cars/audi_rs6_stock/angle_08.png',
                    angle_09: '/assets/cars/audi_rs6_stock/angle_09.png',
                    angle_10: '/assets/cars/audi_rs6_stock/angle_10.png',
                }
            },
            {
                id: 'bmw_m3_stock',
                displayName: 'BMW M3 Competition (Stock)',
                renderUrls: {
                    angle_01: '/assets/cars/bmw_m3_stock/angle_01.png',
                    angle_02: '/assets/cars/bmw_m3_stock/angle_02.png',
                    angle_03: '/assets/cars/bmw_m3_stock/angle_03.png',
                    angle_04: '/assets/cars/bmw_m3_stock/angle_04.png',
                    angle_05: '/assets/cars/bmw_m3_stock/angle_05.png',
                    angle_06: '/assets/cars/bmw_m3_stock/angle_06.png',
                    angle_07: '/assets/cars/bmw_m3_stock/angle_07.png',
                    angle_08: '/assets/cars/bmw_m3_stock/angle_08.png',
                    angle_09: '/assets/cars/bmw_m3_stock/angle_09.png',
                    angle_10: '/assets/cars/bmw_m3_stock/angle_10.png',
                }
            },
            {
                id: 'mercedes_c63_stock',
                displayName: 'Mercedes-AMG C63 (Stock)',
                renderUrls: {
                    angle_01: '/assets/cars/mercedes_c63_stock/angle_01.png',
                    angle_02: '/assets/cars/mercedes_c63_stock/angle_02.png',
                    angle_03: '/assets/cars/mercedes_c63_stock/angle_03.png',
                    angle_04: '/assets/cars/mercedes_c63_stock/angle_04.png',
                    angle_05: '/assets/cars/mercedes_c63_stock/angle_05.png',
                    angle_06: '/assets/cars/mercedes_c63_stock/angle_06.png',
                    angle_07: '/assets/cars/mercedes_c63_stock/angle_07.png',
                    angle_08: '/assets/cars/mercedes_c63_stock/angle_08.png',
                    angle_09: '/assets/cars/mercedes_c63_stock/angle_09.png',
                    angle_10: '/assets/cars/mercedes_c63_stock/angle_10.png',
                }
            },
            {
                id: 'porsche_911_stock',
                displayName: 'Porsche 911 GT3 (Stock)',
                renderUrls: {
                    angle_01: '/assets/cars/porsche_911_stock/angle_01.png',
                    angle_02: '/assets/cars/porsche_911_stock/angle_02.png',
                    angle_03: '/assets/cars/porsche_911_stock/angle_03.png',
                    angle_04: '/assets/cars/porsche_911_stock/angle_04.png',
                    angle_05: '/assets/cars/porsche_911_stock/angle_05.png',
                    angle_06: '/assets/cars/porsche_911_stock/angle_06.png',
                    angle_07: '/assets/cars/porsche_911_stock/angle_07.png',
                    angle_08: '/assets/cars/porsche_911_stock/angle_08.png',
                    angle_09: '/assets/cars/porsche_911_stock/angle_09.png',
                    angle_10: '/assets/cars/porsche_911_stock/angle_10.png',
                }
            },
            {
                id: 'subaru_brz_standard_blue',
                displayName: 'Subaru BRZ (Blue)',
                renderUrls: {
                    angle_01: '/assets/cars/subaru_brz_standard_blue/angle_01.png',
                    angle_02: '/assets/cars/subaru_brz_standard_blue/angle_02.png',
                    angle_03: '/assets/cars/subaru_brz_standard_blue/angle_03.png',
                    angle_04: '/assets/cars/subaru_brz_standard_blue/angle_04.png',
                    angle_05: '/assets/cars/subaru_brz_standard_blue/angle_05.png',
                    angle_06: '/assets/cars/subaru_brz_standard_blue/angle_06.png',
                    angle_07: '/assets/cars/subaru_brz_standard_blue/angle_07.png',
                    angle_08: '/assets/cars/subaru_brz_standard_blue/angle_08.png',
                    angle_09: '/assets/cars/subaru_brz_standard_blue/angle_09.png',
                    angle_10: '/assets/cars/subaru_brz_standard_blue/angle_10.png'
                }
            }
        ];

        const customBuilds = [
            {
                id: 'audi_rs6_custom_blue',
                baseId: 'audi_rs6_stock',
                name: 'Ultra Blue Build',
                thumbnail: '/assets/cars/audi_rs6_custom_blue/angle_01.png',
                renderUrls: {
                    angle_01: '/assets/cars/audi_rs6_custom_blue/angle_01.png',
                    angle_02: '/assets/cars/audi_rs6_custom_blue/angle_02.png',
                    angle_03: '/assets/cars/audi_rs6_custom_blue/angle_03.png',
                    angle_04: '/assets/cars/audi_rs6_custom_blue/angle_04.png',
                    angle_05: '/assets/cars/audi_rs6_custom_blue/angle_05.png',
                    angle_06: '/assets/cars/audi_rs6_custom_blue/angle_06.png',
                    angle_07: '/assets/cars/audi_rs6_custom_blue/angle_07.png',
                    angle_08: '/assets/cars/audi_rs6_custom_blue/angle_08.png',
                    angle_09: '/assets/cars/audi_rs6_custom_blue/angle_09.png',
                    angle_10: '/assets/cars/audi_rs6_custom_blue/angle_10.png',
                }
            },
            {
                id: 'bmw_m3_custom_red',
                baseId: 'bmw_m3_stock',
                name: 'Toronto Red Build',
                thumbnail: '/assets/cars/bmw_m3_custom_red/angle_01.png',
                renderUrls: {
                    angle_01: '/assets/cars/bmw_m3_custom_red/angle_01.png',
                    angle_02: '/assets/cars/bmw_m3_custom_red/angle_02.png',
                    angle_03: '/assets/cars/bmw_m3_custom_red/angle_03.png',
                    angle_04: '/assets/cars/bmw_m3_custom_red/angle_04.png',
                    angle_05: '/assets/cars/bmw_m3_custom_red/angle_05.png',
                    angle_06: '/assets/cars/bmw_m3_custom_red/angle_06.png',
                    angle_07: '/assets/cars/bmw_m3_custom_red/angle_07.png',
                    angle_08: '/assets/cars/bmw_m3_custom_red/angle_08.png',
                    angle_09: '/assets/cars/bmw_m3_custom_red/angle_09.png',
                    angle_10: '/assets/cars/bmw_m3_custom_red/angle_10.png',
                }
            },
            {
                id: 'porsche_911_custom_manthey',
                baseId: 'porsche_911_stock',
                name: 'Manthey Racing Kit',
                thumbnail: '/assets/cars/porsche_911_custom_manthey/angle_01.png',
                renderUrls: {
                    angle_01: '/assets/cars/porsche_911_custom_manthey/angle_01.png',
                    angle_02: '/assets/cars/porsche_911_custom_manthey/angle_02.png',
                    angle_03: '/assets/cars/porsche_911_custom_manthey/angle_03.png',
                    angle_04: '/assets/cars/porsche_911_custom_manthey/angle_04.png',
                    angle_05: '/assets/cars/porsche_911_custom_manthey/angle_05.png',
                    angle_06: '/assets/cars/porsche_911_custom_manthey/angle_06.png',
                    angle_07: '/assets/cars/porsche_911_custom_manthey/angle_07.png',
                    angle_08: '/assets/cars/porsche_911_custom_manthey/angle_08.png',
                    angle_09: '/assets/cars/porsche_911_custom_manthey/angle_09.png',
                    angle_10: '/assets/cars/porsche_911_custom_manthey/angle_10.png',
                }
            },
            {
                id: 'subaru_brz_custom_matte',
                baseId: 'subaru_brz_standard_blue',
                name: 'Matte Grey Custom',
                thumbnail: '/assets/cars/subaru_brz_custom/angle_01.png',
                renderUrls: {
                    angle_01: '/assets/cars/subaru_brz_custom/angle_01.png',
                    angle_02: '/assets/cars/subaru_brz_custom/angle_02.png',
                    angle_03: '/assets/cars/subaru_brz_custom/angle_03.png',
                    angle_04: '/assets/cars/subaru_brz_custom/angle_04.png',
                    angle_05: '/assets/cars/subaru_brz_custom/angle_05.png',
                    angle_06: '/assets/cars/subaru_brz_custom/angle_06.png',
                    angle_07: '/assets/cars/subaru_brz_custom/angle_07.png',
                    angle_08: '/assets/cars/subaru_brz_custom/angle_08.png',
                    angle_09: '/assets/cars/subaru_brz_custom/angle_09.png',
                    angle_10: '/assets/cars/subaru_brz_custom/angle_10.png'
                }
            },
        ];

        // --- ENFORCEMENT & INIT ---
        standardCars = baseModels;
        builds = [...customBuilds];

        // 2. Populate Vehicle Dropdown
        els.select.innerHTML = '<option value="" disabled selected>Select Base Car...</option>';
        standardCars.forEach(car => {
            const opt = document.createElement('option');
            opt.value = car.id;
            opt.innerText = car.displayName || car.name || car.id.replace(/_/g, ' ').toUpperCase();
            els.select.appendChild(opt);
        });

        els.select.onchange = (e) => loadCar(e.target.value);

        // 3. Setup Angle Nav
        els.dots.forEach((dot, idx) => {
            dot.onclick = () => setAngle(idx);
        });

        // Default Load
        const params = new URLSearchParams(window.location.search);
        let targetId = params.get('carId') || 'bmw_m3_stock';
        els.select.value = targetId;
        loadCar(targetId);

    } catch (e) {
        console.warn("Init Warning:", e);
    }
}

function loadCar(id) {
    currentCar = standardCars.find(c => c.id === id);
    if (!currentCar) return;

    // Reset State
    selections = { wrapId: null, wheelId: null };
    currentBuild = null;
    currentManifest = null;

    if (els.summaryName) {
        els.summaryName.innerText = currentCar.displayName || id;
    }

    renderSelectors();
    populateBuildsTab(id);
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
    wrapGrid.className = 'paint-options-grid'; // Use card grid layout

    // Seed wrap options with compatibility and preview images
    const allWraps = [
        { id: 'factory', name: 'Factory Paint', swatch: '#333', image: null, compatible: ['all'] },
        { id: 'matte_coal', name: 'Teckwrap Matte Coal', swatch: '#2a2a2a', image: '/assets/ui/wraps/matte_coal.png', compatible: ['subaru_brz_custom', 'mercedes_c63_stock'] },
        { id: 'camo_green', name: 'Teck Wrap Camo Green', swatch: '#4a5c3e', image: '/assets/ui/wraps/camo_green.png', compatible: ['porsche_911_stock', 'porsche_911_custom_manthey'] }
    ];

    // Filter based on current vehicle
    const visibleWraps = allWraps.filter(w =>
        w.compatible.includes('all') ||
        (currentCar && w.compatible.includes(currentCar.id)) ||
        (currentCar && w.compatible.includes(currentCar.baseId))
    );

    visibleWraps.forEach(paint => {
        const card = document.createElement('div');
        card.className = 'paint-option-card';
        if (selections.wrapId === paint.id) card.classList.add('active');

        // Paint swatch (Image or Color)
        const swatch = document.createElement('div');
        swatch.className = 'paint-swatch';
        if (paint.image) {
            swatch.style.backgroundImage = `url('${paint.image}')`;
            swatch.style.backgroundSize = 'cover';
            swatch.style.backgroundPosition = 'center';
        } else {
            swatch.style.backgroundColor = paint.swatch;
        }

        // Paint name
        const name = document.createElement('span');
        name.className = 'paint-name';
        name.innerText = paint.name;

        card.appendChild(swatch);
        card.appendChild(name);

        // Click opens viewer with this paint
        card.onclick = () => {
            selections.wrapId = paint.id;
            updateVisualizer();
        };

        wrapGrid.appendChild(card);
    });
}

function populatePartsOptionsGrid() {
    const partsGrid = document.getElementById('parts-list');
    const wheelsGrid = document.getElementById('wheels-selector');
    if (!partsGrid && !wheelsGrid) return;

    if (partsGrid) partsGrid.innerHTML = '';
    if (wheelsGrid) wheelsGrid.innerHTML = '';

    // Seed wheel/parts options with proper attribution AND compatibility
    const allParts = [
        { id: 'stock', name: 'Stock Wheels', image: null, compatible: ['all'] },
        { id: 'bbs_fir', name: 'BBS Forged FI-R (Platinum Silver)', image: '/assets/ui/parts/bbs_fir.png', compatible: ['bmw_m3_stock', 'bmw_m3_custom_red'] },
        { id: 'rohana_rfx17', name: 'Rohana RFX17 19" Titanium Forged', image: '/assets/ui/parts/rohana_rfx17.png', compatible: ['mercedes_c63_stock', 'mercedes_c63_custom_coal'] },
        { id: 'te37_bronze', name: 'Volk Racing TE37 Saga S-Plus', image: '/assets/ui/parts/te37_bronze.png', compatible: ['subaru_brz_custom', 'subaru_brz_standard_blue'] },
        { id: 'manthey_carbon', name: 'Manthey Racing Carbon Aero Disc', image: '/assets/ui/parts/manthey_carbon.png', compatible: ['porsche_911_stock', 'porsche_911_custom_manthey'] },
        { id: 'audi_wheels', name: 'Audi RS6 Custom Wheels', image: '/assets/ui/parts/audi_wheels.png', compatible: ['audi_rs6_stock', 'audi_rs6_custom_blue'] }
    ];

    // Filter parts based on current car
    const visibleParts = allParts.filter(p =>
        p.compatible.includes('all') ||
        (currentCar && p.compatible.includes(currentCar.id)) ||
        (currentCar && p.compatible.includes(currentCar.baseId))
    );

    visibleParts.forEach(part => {
        const card = document.createElement('div');
        card.className = 'part-option-card';
        if (selections.wheelId === part.id) card.classList.add('active');

        // Part image
        let img;
        if (part.image) {
            img = document.createElement('img');
            img.src = part.image;
            img.className = 'part-option-image';
            img.style.width = '100%';
            img.style.height = '120px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '4px 4px 0 0';
        } else {
            img = document.createElement('div');
            img.className = 'part-image-placeholder';
            img.innerText = '🔧';
        }

        const name = document.createElement('span');
        name.className = 'part-name';
        name.innerText = part.name;

        card.appendChild(img);
        card.appendChild(name);

        card.onclick = () => {
            selections.wheelId = part.id;
            updateVisualizer();
        };

        // Clone for both grids to be safe, or just append to one
        if (wheelsGrid) wheelsGrid.appendChild(card.cloneNode(true));
        if (partsGrid) partsGrid.appendChild(card);
    });

    // Re-attach onclicks to clones if both present
    if (wheelsGrid && partsGrid) {
        Array.from(wheelsGrid.children).forEach((child, idx) => {
            child.onclick = () => {
                selections.wheelId = visibleParts[idx].id;
                updateVisualizer();
            };
        });
    }
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

// Preload all car angles into browser cache for instant rotation
function preloadCarAngles() {
    if (!currentCar) return;

    // Manifest Mode Preload
    if (currentManifest && currentManifest.angles) {
        console.log(`🔄 Preloading Manifest Angles for ${currentManifest.sourceModel}...`);
        if (!preloadedImages[currentCar.id]) preloadedImages[currentCar.id] = {};

        currentManifest.angles.forEach(angle => {
            const key = `manifest_${currentManifest.sourceModel}_${angle.angleId}`;
            const url = currentManifest.baseUrl + '/' + angle.filename;
            const img = new Image();
            img.src = url;
            preloadedImages[currentCar.id][key] = img;
        });
        console.log(`✅ Preloaded ${currentManifest.angles.length} manifest angles`);
        return;
    }

    if (!currentCar.renderUrls && !currentCar.photoAnglesHttp) return;

    console.log(`🔄 Preloading ${currentCar.id} angles...`);
    const urlMap = currentCar.renderUrls || currentCar.photoAnglesHttp || currentCar.images || {};
    preloadedImages[currentCar.id] = {};

    ANGLE_KEYS.forEach((key, idx) => {
        // Try Legacy
        let url = urlMap[key];

        // Try New
        if (!url) {
            const angleNum = idx + 1;
            const angleKey = `angle_${angleNum < 10 ? '0' + angleNum : angleNum}`;
            url = urlMap[angleKey];
        }

        if (url) {
            const img = new Image();
            img.src = url;
            preloadedImages[currentCar.id][key] = img; // Key by semantic index for lookup
        }
    });

    console.log(`✅ Preloaded ${Object.keys(preloadedImages[currentCar.id]).length} angles`);
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
    if (!currentCar) return;

    // Determine Source & Mode
    // Priority: Manifest (Build) > currentBuild > currentCar
    let anglesList = ANGLE_KEYS;
    let isManifestMode = false;

    if (currentManifest && currentManifest.angles) {
        isManifestMode = true;
        anglesList = currentManifest.angles;
    }

    // Bounds check
    if (index < 0) index = 0;
    if (index >= anglesList.length) index = anglesList.length - 1;

    // Update Dots UI
    els.dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
    });

    // Determine URL
    let url = '';
    let key = '';

    if (isManifestMode) {
        const angleData = anglesList[index];
        url = currentManifest.baseUrl + '/' + angleData.filename;
        key = angleData.angleId;
    } else {
        key = ANGLE_KEYS[index]; // e.g., 'driver_front'
        const source = currentBuild || currentCar;
        const urlMap = source.renderUrls || source.photoAnglesHttp || source.images || {};

        // 1. Try semantic key
        url = urlMap[key];

        // 2. Try index-based key (angle_01)
        if (!url) {
            const angleNum = index + 1;
            const angleKey = `angle_${angleNum < 10 ? '0' + angleNum : angleNum}`;
            url = urlMap[angleKey];
        }

        // 3. Fallback to currentCar if currentBuild lacks this specific angle
        if (!url && currentBuild) {
            const baseMap = currentCar.renderUrls || {};
            url = baseMap[key] || baseMap[`angle_${(index + 1 < 10) ? '0' + (index + 1) : (index + 1)}`];
        }
    }

    if (url) {
        // Simple and reliable image update
        els.img.src = url;
        els.img.onerror = () => {
            console.warn("Image Check Failed:", url);
            els.img.alt = "Render not available";
        };
    } else {
        console.warn(`Angle ${index} not found for car ${currentCar.id}`);
        els.img.alt = "Render not available";
    }

    currentAngleIndex = index;
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

    // 1. Find matching build
    // Relaxed Logic: 
    // A. Exact Match (Car + Wrap + Wheel)
    // B. Best Match (Car + Wheel + implied Wrap) -> Auto-switch wrap if needed

    let match = builds.find(b =>
        b.carId === currentCar.id &&
        b.wrapId === selections.wrapId &&
        b.wheelId === selections.wheelId
    );

    // Fallback: If we have a wheel selected but no exact build match, 
    // check if this wheel belongs to a unique build for this car.
    if (!match && selections.wheelId && selections.wheelId !== 'stock') {
        const potentialBuild = builds.find(b =>
            b.carId === currentCar.id &&
            b.wheelId === selections.wheelId
        );

        if (potentialBuild) {
            console.log("Auto-switching to match Best Build:", potentialBuild.id);
            match = potentialBuild;
            // Optionally update the wrap selection state to match visual
            // selections.wrapId = potentialBuild.wrapId; 
        }
    }

    currentBuild = match || null;

    // Manifest Handling
    if (currentBuild && currentBuild.manifestUrl) {
        console.log("Fetching Manifest:", currentBuild.manifestUrl);
        const manifest = await fetchManifest(currentBuild.manifestUrl);
        if (manifest) {
            // Attach baseUrl for relative asset loading
            manifest.baseUrl = currentBuild.manifestUrl.substring(0, currentBuild.manifestUrl.lastIndexOf('/'));
            currentManifest = manifest;
        } else {
            currentManifest = null;
        }
    } else {
        currentManifest = null;
    }

    // 2. Update Summary Panel
    const wrapEl = document.getElementById('summary-wrap');
    if (wrapEl) {
        const wrap = wraps.find(w => w.id === selections.wrapId);
        wrapEl.innerText = wrap ? wrap.product_name : 'Factory';
    }

    const countEl = document.getElementById('summary-parts-count');
    if (countEl) {
        const wheel = wheels.find(w => w.id === selections.wheelId);
        countEl.innerText = wheel ? wheel.brand + ' ' + wheel.product_name : 'Stock';
    }

    // 3. Preload and Update View
    preloadCarAngles();
    setAngle(currentAngleIndex);
}

function populateBuildsTab(baseId) {
    const gallery = document.getElementById('builds-gallery');
    if (!gallery) return;

    gallery.innerHTML = '';

    // Find builds related to this baseId
    // Note: customBuilds are already merged into the global 'builds' array, but we can access them directly or filter
    // For simplicity, we filter the standard 'builds' array which now includes our locals
    const relatedBuilds = builds.filter(b => b.baseId === baseId);

    if (relatedBuilds.length === 0) {
        gallery.innerHTML = '<div class="no-builds">No custom builds found for this model yet.</div>';
        return;
    }

    relatedBuilds.forEach(build => {
        const div = document.createElement('div');
        div.className = 'build-item';
        div.onclick = () => loadCustomBuild(build.id);

        const img = document.createElement('img');
        img.src = build.thumbnail || build.renderUrls.angle_01 || build.renderUrls.driver_front || '';
        img.alt = build.name;

        const span = document.createElement('span');
        span.innerText = build.name;

        div.appendChild(img);
        div.appendChild(span);
        gallery.appendChild(div);
    });
}

function loadCustomBuild(buildId) {
    const build = builds.find(b => b.id === buildId);
    if (!build) return;

    currentBuild = build;

    // Apply specific selections implied by this build (optional, but helps UI sync)
    if (build.wrapId) selections.wrapId = build.wrapId;
    if (build.wheelId) selections.wheelId = build.wheelId;

    // Refresh UI
    renderSelectors();
    preloadCarAngles();
    setAngle(0);

    console.log(`✅ Loaded custom build: ${build.name}`);
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

// Boot
init();
