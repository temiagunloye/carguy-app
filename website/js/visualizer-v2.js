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
let currentCar = null;
let currentAngleIndex = 0;

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
        // 1. Fetch Standard Cars
        const snap = await getDocs(collection(db, "standardCars"));
        standardCars = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        // 2. Populate Dropdown
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
        const target = standardCars.find(c => c.id === showcaseId) ? showcaseId : standardCars[0]?.id;

        if (target) {
            loadCar(target);
            els.select.value = target;
        }

    } catch (e) {
        console.warn("Init Warning:", e);
        // Fallback: Continue loading even if Auth fails (Public Mode)
        if (e.code === 'auth/unauthorized-domain') {
            console.log("Domain not whitelisted, proceeding in Guest Mode via Public access.");
        } else {
            console.error(e);
        }
    } finally {
        els.spinner.style.display = 'none';

        // Force Load if not already
        if (!currentCar && standardCars.length > 0) {
            loadCar('porsche_911_2024');
        }
    }
}

function loadCar(id) {
    currentCar = standardCars.find(c => c.id === id);
    if (!currentCar) return;

    // Update Summary
    els.summaryName.innerText = currentCar.displayName || id;

    // Reset Angle
    setAngle(0);
}

function setAngle(index) {
    if (!currentCar) return;

    // Bounds check
    if (index < 0) index = 0;
    if (index >= ANGLE_KEYS.length) index = ANGLE_KEYS.length - 1;

    const key = ANGLE_KEYS[index];

    // DEBUG UPDATE (with null safety)
    const dbgCar = document.getElementById('dbg-car');
    const dbgAngle = document.getElementById('dbg-angle');
    const dbgStatus = document.getElementById('dbg-status');
    const dbgUrl = document.getElementById('dbg-url');

    if (dbgCar) dbgCar.innerText = currentCar ? currentCar.id : 'None';
    if (dbgAngle) dbgAngle.innerText = key;
    if (dbgStatus) dbgStatus.innerText = 'Loading...';

    // Update Dots UI
    els.dots.forEach((d, i) => {
        d.classList.toggle('active', i === index);
    });

    // Update Main Image
    const urlMap = currentCar.photoAnglesHttp || {};
    let url = urlMap[key];

    if (dbgUrl) dbgUrl.innerText = url || 'UNDEFINED';

    if (url) {
        // Show Spinner
        els.spinner.style.display = 'block';

        const cacheBuster = url.includes('?') ? '&v=real' : '?v=real';
        els.img.src = url + cacheBuster;

        els.img.onload = () => {
            els.spinner.style.display = 'none';
            if (dbgStatus) {
                dbgStatus.innerText = 'LOADED (Success)';
                dbgStatus.style.color = '#0f0';
            }
        }

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
    } else {
        console.warn(`Angle ${key} not found for car ${currentCar.id}`);
        if (dbgStatus) dbgStatus.innerText = 'MISSING KEY';
        els.img.src = "/assets/hero-visualizer-DnLwM_OV.png";
    }

    currentAngleIndex = index;
}

// Global scope for onclicks in HTML (if any remain)
window.setAngle = setAngle;

window.updateVisualizer = function () {
    console.log("Updating Visualizer Configuration...");

    // 1. Get Part States
    const isLowered = document.querySelector('input[data-part="lowered"]')?.checked;
    const hasLip = document.querySelector('input[data-part="lip"]')?.checked;
    const hasWing = document.querySelector('input[data-part="wing"]')?.checked;

    // 2. Update UI Summary
    let count = 0;
    if (isLowered) count++;
    if (hasLip) count++;
    if (hasWing) count++;

    const countEl = document.getElementById('summary-parts-count');
    if (countEl) countEl.innerText = `${count} installed`;

    // 3. Simple Visual Feedback (Simulation Preview)
    // "Lowering" effect via CSS
    if (isLowered) {
        els.img.style.transform = "translateY(15px) scale(1.02)"; // Drop and slight zoom
        els.img.style.transition = "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
    } else {
        els.img.style.transform = "none";
    }

    // "Wing" effect (Dummy alert for now or console)
    if (hasWing) {
        console.log("Wing enabled - Waiting for Part Mask");
    }
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
