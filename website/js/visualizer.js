import { localBuildService } from './localBuildService.js';

// Configuration
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "carguy-app-v1.firebaseapp.com",
    projectId: "carguy-app-v1",
    storageBucket: "carguy-app-v1.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef"
};

// Initialize Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { addDoc, collection, doc, getDoc, getDocs, getFirestore, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sounds (Base64 for portability in V1)
const CLICK_SOUND = new Audio("data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA="); // Placeholder silent wav, real one would be longer
// For V1, we'll just log "Click" interactions or use browser beep if enabled, 
// but actually, let's use a very short visual transition instead of sound to avoid autoplay blocked issues.

// State
let currentVehicle = null;
let currentAngle = 0;
let currentWrap = null;
let installedParts = {
    lip: false,
    skirts: false,
    wing: false,
    lowered: false
};
const angles = ['front', 'front-left', 'left', 'rear-left', 'rear', 'rear-right', 'right', 'front-right', 'top', 'interior'];
const imageCache = new Map(); // Cache for preloaded images

// DOM Elements
const vehicleSelect = document.getElementById('vehicle-selector');
const wrapSelect = document.getElementById('wrap-selector');
const mainImage = document.getElementById('main-vehicle-image');
const spinner = document.getElementById('loading-spinner');
const costEl = document.getElementById('summary-cost');
const partsCountEl = document.getElementById('summary-parts-count');
const wrapNameEl = document.getElementById('summary-wrap');
const vehicleNameEl = document.getElementById('summary-vehicle-name');

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    await localBuildService.init();
    await loadVehicles();
    renderWrapSelectors();

    // Determine Mode
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get('id');

    if (path.includes('shared-build.html') && sharedId) {
        initSharedMode(sharedId);
    } else if (path.includes('shop/simulator.html')) {
        initShopMode();
    } else {
        checkLocalSave();
        // Auto-rotate demo on first load
        setTimeout(() => autoRotate(), 1500);
    }
});

let rotateInterval;
function autoRotate() {
    if (!currentVehicle) return;
    let count = 0;
    rotateInterval = setInterval(() => {
        setAngle((currentAngle + 1) % angles.length);
        count++;
        if (count >= angles.length) clearInterval(rotateInterval);
    }, 800); // 800ms per frame

    // Stop on interaction
    document.querySelector('.angle-nav').addEventListener('click', () => clearInterval(rotateInterval));
}

// Mode Handling
async function initSharedMode(id) {
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(el => el.disabled = true);
    document.querySelectorAll('.color-swatch').forEach(el => el.style.pointerEvents = 'none');

    const container = document.querySelector('.visualizer-container');
    if (container) {
        const banner = document.createElement('div');
        banner.style.cssText = "background:#3b82f6; color:white; padding:10px; text-align:center; font-weight:bold; position:absolute; top:0; left:0; right:0; z-index:1000;";
        banner.innerText = "View-Only Shared Build";
        container.style.position = 'relative';
        container.prepend(banner);
    }

    try {
        const docRef = doc(db, "sharedBuilds", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            vehicleSelect.value = data.vehicleId;
            // Fetch vehicle data manually since select change might not trigger if value set programmatically
            const vParam = { target: { value: data.vehicleId } };
            const docRefV = doc(db, "vehicles", data.vehicleId);
            const docSnapV = await getDoc(docRefV);
            if (docSnapV.exists()) {
                currentVehicle = { id: docSnapV.id, ...docSnapV.data() };

                setTimeout(() => {
                    if (data.wrap) selectWrap(data.wrap);
                    installedParts = data.parts;
                    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        if (installedParts[cb.dataset.part]) cb.checked = true;
                    });
                    updateVisualizer();
                    preloadVehicleImages(currentVehicle); // Preload after load
                }, 200);
            }
        } else {
            alert("Build not found");
        }
    } catch (e) {
        console.error(e);
    }
}

function initShopMode() {
    const actionContainer = document.querySelector('.action-buttons');
    if (actionContainer) {
        const sendBtn = document.createElement('button');
        sendBtn.className = 'btn-viz btn-viz-primary';
        sendBtn.innerText = "📧 Email Quote to Customer";
        sendBtn.style.marginBottom = '10px';
        sendBtn.onclick = () => {
            const email = prompt("Enter Customer Email:");
            if (email) {
                alert(`Quote queued for ${email}!\n(Email integration coming in Phase 2)`);
            }
        };
        actionContainer.prepend(sendBtn);
    }
    checkLocalSave();
}

async function checkLocalSave() {
    const saved = await localBuildService.loadBuild();
    if (saved) {
        document.getElementById('local-builds-list').innerHTML = `
            <div style="background:rgba(255,255,255,0.05); padding:8px; border-radius:4px; margin-top:8px;">
                <strong>${saved.metadata.name}</strong><br>
                <span class="text-muted">Last edited: ${new Date(saved.updatedAt).toLocaleDateString()}</span>
                <br>
                <button onclick="window.loadSavedToVisualizer()" style="background:none; border:none; color:#3b82f6; cursor:pointer; padding:0; font-size:12px; margin-top:4px;">Load Saved Build</button>
            </div>
        `;
    }
}

// Core Functions
async function loadVehicles() {
    try {
        const querySnapshot = await getDocs(collection(db, "vehicles"));
        vehicleSelect.innerHTML = '<option value="" disabled selected>Select Base Car...</option>';
        const vehicleMap = {};

        querySnapshot.forEach((doc) => {
            const v = doc.data();
            const opt = document.createElement('option');
            opt.value = doc.id;
            opt.textContent = `${v.year} ${v.make} ${v.model} ${v.variant}`;
            vehicleSelect.appendChild(opt);
            vehicleMap[doc.id] = { id: doc.id, ...v };
        });

        vehicleSelect.addEventListener('change', (e) => {
            const vId = e.target.value;
            if (vehicleMap[vId]) {
                currentVehicle = vehicleMap[vId];
                updateVisualizer();
                preloadVehicleImages(currentVehicle);
            }
        });

    } catch (e) {
        console.error("Error loading vehicles:", e);
        // Fallback
        const demoVehicles = [
            { id: '1', make: 'Porsche', model: '911', variant: 'Carrera 4S', year: 2024, basePrice: 138600 },
            { id: '2', make: 'BMW', model: 'M3', variant: 'Competition', year: 2024, basePrice: 84300 },
            { id: '3', make: 'Subaru', model: 'BRZ', variant: 'tS', year: 2024, basePrice: 35395 }
        ];

        vehicleSelect.innerHTML = '<option value="" disabled selected>Select Base Car (Offline Mode)</option>';
        demoVehicles.forEach(v => {
            const opt = document.createElement('option');
            opt.value = v.id;
            opt.textContent = `${v.year} ${v.make} ${v.model} ${v.variant}`;
            vehicleSelect.appendChild(opt);
        });

        vehicleSelect.addEventListener('change', (e) => {
            const vId = e.target.value;
            currentVehicle = demoVehicles.find(v => v.id === vId);
            updateVisualizer();
            preloadVehicleImages(currentVehicle);
        });
    }
}

function renderWrapSelectors() {
    wrapSelect.innerHTML = '';
    wrapColors.forEach(color => {
        const div = document.createElement('div');
        div.className = 'color-swatch';
        div.style.backgroundColor = color.hex;
        div.onclick = () => selectWrap(color);
        if (color.tier === 'pro') div.dataset.tier = 'pro';
        wrapSelect.appendChild(div);
    });
}

function selectWrap(color) {
    currentWrap = color;
    wrapNameEl.textContent = color.name + (color.tier === 'pro' ? ' (Pro)' : '');

    document.querySelectorAll('.color-swatch').forEach(el => {
        el.classList.remove('active');
        if (el.style.backgroundColor === color.hex ||
            el.style.backgroundColor === `rgb(${hexToRgb(color.hex)})`) {
            el.classList.add('active');
        }
    });

    updateSummary();
}

// Global Exports
window.setAngle = (idx) => {
    currentAngle = idx;
    document.querySelectorAll('.angle-dot').forEach((dot, i) => {
        if (i === idx) dot.classList.add('active');
        else dot.classList.remove('active');
    });
    updateImage();
};

window.updateVisualizer = () => {
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        installedParts[cb.dataset.part] = cb.checked;
    });
    updateImage();
    updateSummary();
};

function updateImage() {
    if (!currentVehicle) return;

    const angleName = angles[currentAngle];
    // Cache Key: vehicleId-angle
    const cacheKey = `${currentVehicle.id}-${angleName}`;

    // Check Cache first
    if (imageCache.has(cacheKey)) {
        mainImage.src = imageCache.get(cacheKey).src;
        return;
    }

    spinner.style.display = 'block';
    // Logic: If real storageUrl exists in currentVehicle.angles map (from db), use it.
    // Otherwise fallback to placeholder
    const url = `https://placehold.co/1920x1080/000000/FFF?text=${currentVehicle.make}+${currentVehicle.model}+-+${angleName}`;

    mainImage.onload = () => { spinner.style.display = 'none'; };
    mainImage.src = url;
}

// Preloader
function preloadVehicleImages(vehicle) {
    console.log("Preloading images for", vehicle.make);
    angles.forEach(angleName => {
        const url = `https://placehold.co/1920x1080/000000/FFF?text=${vehicle.make}+${vehicle.model}+-+${angleName}`;
        const img = new Image();
        img.src = url;
        imageCache.set(`${vehicle.id}-${angleName}`, img);
    });
}

function updateSummary() {
    if (!currentVehicle) return;

    vehicleNameEl.textContent = `${currentVehicle.make} ${currentVehicle.model}`;
    let total = currentVehicle.basePrice || 0;
    let partsCount = 0;

    if (installedParts.lip) { total += 800; partsCount++; }
    if (installedParts.skirts) { total += 600; partsCount++; }
    if (installedParts.wing) { total += 1200; partsCount++; }
    if (installedParts.lowered) { total += 400; partsCount++; }

    if (currentWrap && currentWrap.tier === 'pro') {
        total += 3500;
    } else if (currentWrap) {
        total += 2500;
    }

    // Animate Price: simple counter effect if big jump?
    // For V1 just text
    costEl.textContent = '$' + total.toLocaleString();
    partsCountEl.textContent = `${partsCount} installed`;
}

window.generateShareLink = async () => {
    if (!currentVehicle) return alert("Select a vehicle first.");

    try {
        const buildData = {
            vehicleId: currentVehicle.id,
            wrap: currentWrap,
            parts: installedParts,
            createdAt: serverTimestamp()
        };
        const docRef = await addDoc(collection(db, "sharedBuilds"), buildData);
        const url = `${window.location.host}/shared-build.html?id=${docRef.id}`;
        navigator.clipboard.writeText(url);
        alert("Build Link Copied to Clipboard!\n" + url);
    } catch (e) {
        console.error("Error sharing:", e);
        alert("Sharing requires database connection. (Mock link for now: /shared-build.html?id=demo)");
    }
};

window.saveLocalBuild = async () => {
    if (!currentVehicle) return alert("Select a vehicle first.");
    const buildData = {
        vehicleId: currentVehicle.id,
        vehicleName: `${currentVehicle.make} ${currentVehicle.model}`,
        wrap: currentWrap,
        parts: installedParts,
        metadata: {
            name: `${currentVehicle.year} ${currentVehicle.model} Build`,
        }
    };
    await localBuildService.saveBuild(buildData);
    const status = document.getElementById('save-status');
    status.style.opacity = '1';
    setTimeout(() => status.style.opacity = '0', 3000);
    checkLocalSave();
};

window.clearBuild = async () => {
    if (confirm("Clear local build?")) {
        await localBuildService.clearBuild();
        document.getElementById('local-builds-list').innerHTML = '<p>No saved builds</p>';
    }
};

window.loadSavedToVisualizer = async () => {
    const saved = await localBuildService.loadBuild();
    if (!saved) return;
    vehicleSelect.value = saved.vehicleId;
    const event = new Event('change');
    vehicleSelect.dispatchEvent(event);
    setTimeout(() => {
        if (saved.wrap) selectWrap(saved.wrap);
        installedParts = saved.parts;
        document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            if (installedParts[cb.dataset.part]) cb.checked = true;
            else cb.checked = false;
        });
        updateVisualizer();
    }, 500);
};

function hexToRgb(hex) {
    if (!hex) return '0,0,0';
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16)
        : null;
}
