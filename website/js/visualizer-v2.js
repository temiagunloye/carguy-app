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
let currentCar = null;
let currentBuild = null;
let selections = {
    wrapId: null,
    wheelId: null
};
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
    spinner: document.getElementById('loading-spinner')
};

async function init() {
    console.log("Starting Shop Visualizer...");
    els.spinner.style.display = 'block';

    try {
        // 1. Fetch Data in Parallel
        const [carsSnap, wheelsSnap, wrapsSnap, buildsSnap] = await Promise.all([
            getDocs(collection(db, "standardCars")),
            getDocs(collection(db, "wheels")),
            getDocs(collection(db, "wraps")),
            getDocs(collection(db, "builds"))
        ]);

        standardCars = carsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        wheels = wheelsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        wraps = wrapsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        builds = buildsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Populate Vehicle Dropdown
        els.select.innerHTML = '<option value="" disabled selected>Select Base Car...</option>';
        standardCars.forEach(car => {
            const opt = document.createElement('option');
            opt.value = car.id;
            opt.innerText = car.displayName || car.id.replace(/_/g, ' ').toUpperCase();
            els.select.appendChild(opt);
        });

        els.select.onchange = (e) => loadCar(e.target.value);

        // 3. Setup Angle Nav
        els.dots.forEach((dot, idx) => {
            dot.onclick = () => setAngle(idx);
        });

        // 4. Auto-select Porsche 911 (Showcase) or first
        const showcaseId = 'porsche_911_2024';
        const target = standardCars.find(c => c.id === showcaseId) ? showcaseId : (standardCars[0]?.id || null);

        if (target) {
            els.select.value = target;
            loadCar(target);
        }

    } catch (e) {
        console.warn("Init Warning:", e);
    } finally {
        els.spinner.style.display = 'none';
    }
}

function loadCar(id) {
    currentCar = standardCars.find(c => c.id === id);
    if (!currentCar) return;

    // Reset Selections
    selections = { wrapId: null, wheelId: null };
    currentBuild = null;

    // Update Summary
    els.summaryName.innerText = currentCar.displayName || id;

    // Populate Selectors for this car
    renderSelectors();
    populateBuildsGallery();

    // Preload all angles for instant rotation
    preloadCarAngles();

    // Reset Angle
    setAngle(0);
}

function renderSelectors() {
    // 1. Wrap Selector
    const wrapGrid = document.getElementById('wrap-selector');
    if (wrapGrid) {
        wrapGrid.innerHTML = '';

        // Add "Factory" option
        const factory = createWrapOption('factory', 'Factory', '#333');
        if (!selections.wrapId) factory.classList.add('active');
        wrapGrid.appendChild(factory);

        wraps.filter(w => w.vehicles.includes(currentCar.id)).forEach(wrap => {
            const opt = createWrapOption(wrap.id, wrap.product_name, wrap.hex_code || '#555');
            if (selections.wrapId === wrap.id) opt.classList.add('active');
            wrapGrid.appendChild(opt);
        });
    }

    // 2. Wheels Selector
    const wheelsGrid = document.getElementById('wheels-selector');
    if (wheelsGrid) {
        wheelsGrid.innerHTML = '';

        // Add "Stock" radio
        const stock = createWheelOptionItem('stock', 'Stock Wheels', !selections.wheelId);
        wheelsGrid.appendChild(stock);

        wheels.filter(w => w.vehicle === currentCar.id).forEach(wheel => {
            const opt = createWheelOptionItem(wheel.id, `${wheel.brand} ${wheel.product_name}`, selections.wheelId === wheel.id);
            wheelsGrid.appendChild(opt);
        });
    }
}

function createWrapOption(id, name, color) {
    const div = document.createElement('div');
    div.className = 'color-swatch';
    div.style.backgroundColor = color;
    div.title = name;
    div.onclick = () => {
        document.querySelectorAll('#wrap-selector .color-swatch').forEach(el => el.classList.remove('active'));
        div.classList.add('active');
        window.selectWrap(id);
    };
    return div;
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

function populateBuildsGallery() {
    const gallery = document.getElementById('builds-gallery');
    if (!gallery) return;

    gallery.innerHTML = '';
    const carBuilds = builds.filter(b => b.carId === currentCar.id);

    if (carBuilds.length === 0) {
        gallery.innerHTML = '<p class="text-xs text-muted">No custom builds available for this model yet.</p>';
        return;
    }

    carBuilds.forEach(build => {
        const wrap = wraps.find(w => w.id === build.wrapId);
        const wheel = wheels.find(w => w.id === build.wheelId);

        const card = document.createElement('div');
        card.className = 'build-preset-card';
        card.style.background = 'rgba(255,255,255,0.05)';
        card.style.padding = '10px';
        card.style.borderRadius = '8px';
        card.style.cursor = 'pointer';
        card.style.border = '1px solid var(--hud-border)';

        // Show the first angle as a thumbnail
        const thumbUrl = build.photoAnglesHttp?.driver_front || '';

        card.innerHTML = `
            <img src="${thumbUrl}" style="width:100%; border-radius:4px; margin-bottom:8px;">
            <div style="font-size:10px; font-weight:600; color:white; line-height:1.2;">
                ${wrap ? wrap.product_name : 'Factory Paint'}<br>
                <span style="color:var(--hud-accent)">${wheel ? wheel.brand : ''}</span>
            </div>
        `;

        card.onclick = () => {
            selections.wrapId = build.wrapId;
            selections.wheelId = build.wheelId;
            updateVisualizer();
            renderSelectors();
        };

        gallery.appendChild(card);
    });
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
    if (!currentCar || !currentCar.photoAnglesHttp) return;

    console.log(`🔄 Preloading ${currentCar.id} angles...`);
    const urlMap = currentCar.photoAnglesHttp;
    preloadedImages[currentCar.id] = {};

    ANGLE_KEYS.forEach(key => {
        const url = urlMap[key];
        if (url) {
            const img = new Image();
            img.src = url;
            preloadedImages[currentCar.id][key] = img;
        }
    });

    console.log(`✅ Preloaded ${Object.keys(preloadedImages[currentCar.id]).length} angles`);
}

function setAngle(index) {
    if (!currentCar) return;

    // Bounds check
    if (index < 0) index = 0;
    if (index >= ANGLE_KEYS.length) index = ANGLE_KEYS.length - 1;

    const key = ANGLE_KEYS[index];

    // Update Dots UI
    els.dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
    });

    // Determine target image set
    const source = currentBuild || currentCar;
    const urlMap = source.photoAnglesHttp || {};
    let url = urlMap[key];

    // Fallback to base car if build angle is missing
    if (!url && currentBuild) {
        url = currentCar.photoAnglesHttp?.[key];
    }

    if (dbgUrl) dbgUrl.innerText = url || 'UNDEFINED';

    if (url) {
        // Use preloaded image if available for instant display
        const preloaded = preloadedImages[currentCar.id]?.[key];

        if (preloaded && preloaded.complete) {
            // Instant swap - no loading needed!
            els.img.src = url;
            if (dbgStatus) {
                dbgStatus.innerText = 'LOADED (Cached)';
                dbgStatus.style.color = '#0f0';
            }
        } else {
            // Fallback: Show spinner for first load
            els.spinner.style.display = 'block';

            els.img.src = url;

            els.img.onload = () => {
                els.spinner.style.display = 'none';
                if (dbgStatus) {
                    dbgStatus.innerText = 'LOADED (Success)';
                    dbgStatus.style.color = '#0f0';
                }
            };

            els.img.onerror = () => {
                console.warn("Image Check Failed:", url);
                els.spinner.style.display = 'none';
                if (dbgStatus) {
                    dbgStatus.innerText = 'ERROR (Failed)';
                    dbgStatus.style.color = '#fff';
                }
                // Fallback to local asset if remote fails
                els.img.src = "/assets/hero-visualizer-DnLwM_OV.png";
            };
        }
    } else {
        console.warn(`Angle ${key} not found for car ${currentCar.id}`);
        if (dbgStatus) dbgStatus.innerText = 'MISSING KEY';
        els.img.src = "/assets/hero-visualizer-DnLwM_OV.png";
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

window.updateVisualizer = function () {
    console.log("Updating Visualizer Configuration...", selections);

    // 1. Find matching build
    const match = builds.find(b =>
        b.carId === currentCar.id &&
        b.wrapId === selections.wrapId &&
        b.wheelId === selections.wheelId
    );

    currentBuild = match || null;

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

// Boot
init();
