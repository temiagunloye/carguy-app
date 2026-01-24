import { localBuildService } from './localBuildService.js';

// Configuration (Placeholder)
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

// Data
const wrapColors = [
    { name: 'Gloss Black', hex: '#000000', tier: 'free' },
    { name: 'Alpine White', hex: '#ffffff', tier: 'free' },
    { name: 'Silver Metallic', hex: '#c0c0c0', tier: 'free' },
    { name: 'Guards Red', hex: '#ef4444', tier: 'free' },
    { name: 'Miami Blue', hex: '#3b82f6', tier: 'free' },
    { name: 'Matte Grey', hex: '#4b5563', tier: 'pro' },
    { name: 'Midnight Purple', hex: '#4c1d95', tier: 'pro' },
    { name: 'Acid Green', hex: '#a3e635', tier: 'pro' }
];

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
        // Standard Preview Mode
        checkLocalSave();
    }
});

// Mode Handling
async function initSharedMode(id) {
    // Disable Controls
    const inputs = document.querySelectorAll('input, select');
    inputs.forEach(el => el.disabled = true);
    document.querySelectorAll('.color-swatch').forEach(el => el.style.pointerEvents = 'none');

    // Show Banner
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
            // Load Vehicle
            vehicleSelect.value = data.vehicleId;
            // Manually trigger change
            const vParam = { target: { value: data.vehicleId } };
            // Simulate change
            const vId = data.vehicleId;
            const docRefV = doc(db, "vehicles", vId);
            const docSnapV = await getDoc(docRefV);
            if (docSnapV.exists()) {
                currentVehicle = { id: docSnapV.id, ...docSnapV.data() };

                // Wait for vehicle load then apply parts
                setTimeout(() => {
                    // Apply Wrap
                    if (data.wrap) selectWrap(data.wrap);

                    // Apply Parts
                    installedParts = data.parts;
                    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
                        if (installedParts[cb.dataset.part]) cb.checked = true;
                    });

                    updateVisualizer();
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
    // Add "Send Quote" button to actions
    const actionContainer = document.querySelector('.action-buttons');
    if (actionContainer) {
        const sendBtn = document.createElement('button');
        sendBtn.className = 'btn-viz btn-viz-primary';
        sendBtn.innerText = "📧 Email Quote to Customer";
        sendBtn.style.marginBottom = '10px';
        sendBtn.onclick = () => {
            const email = prompt("Enter Customer Email:");
            if (email) {
                // In V2 this writes to emailQueue
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

        // Cache docs for easier access
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
            }
        });

    } catch (e) {
        console.error("Error loading vehicles:", e);
        // Fallback demo data
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

    // Update active class
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

    spinner.style.display = 'block';
    const angleName = angles[currentAngle];
    // Placeholder logic
    const url = `https://placehold.co/1920x1080/000000/FFF?text=${currentVehicle.make}+${currentVehicle.model}+-+${angleName}`;

    mainImage.onload = () => { spinner.style.display = 'none'; };
    mainImage.src = url;
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

    checkLocalSave(); // Refresh list
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

    // We need to match vehicle ID, but assuming standard vehicles for now or stored vehicleId is valid
    // For demo/V1 we might need to just force set the values
    vehicleSelect.value = saved.vehicleId;
    // Trigger change handling manually to set currentVehicle
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

// Formatting Aid
function hexToRgb(hex) {
    if (!hex) return '0,0,0';
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        parseInt(result[1], 16) + ", " + parseInt(result[2], 16) + ", " + parseInt(result[3], 16)
        : null;
}
