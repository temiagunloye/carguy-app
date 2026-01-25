import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { doc, getDoc, getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Public Firebase Config (Safe to expose in frontend for read access)
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

// Spin Order (Horizontal Ring)
const SPIN_ORDER = [
    'front_center',
    'passenger_front',
    'full_passenger_side',
    'passenger_rear',
    'rear_center',
    'driver_rear',
    'full_driver_side',
    'driver_front'
];

// State
let images = [];
let currentIndex = 0;
let isDragging = false;
let startX = 0;
let startIdx = 0;

// Elements
const els = {
    container: document.getElementById('viewerContainer'),
    metadata: {
        title: document.getElementById('carTitle'),
        subtitle: document.getElementById('carSubtitle')
    },
    canvas: document.getElementById('spinnerCanvas'),
    loader: document.getElementById('loadingOverlay'),
    error: null
}

async function init() {
    // 1. Get Car ID
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('carId');

    if (!carId) {
        showError("No Car ID specified. Try ?carId=porsche_911_2024");
        return;
    }

    // 2. Fetch Data
    try {
        const docRef = doc(db, "standardCars", carId);
        const snapshot = await getDoc(docRef);

        if (!snapshot.exists()) {
            showError("Car not found in database.");
            return;
        }

        const data = snapshot.data();
        renderMetadata(data, carId);

        // 3. Prepare Images
        await preloadImages(data.photoAnglesHttp || {}); // Prefer HTTP URLs

        // 4. Start Interaction
        setupInteraction();
        els.loader.style.display = 'none';

    } catch (e) {
        console.error(e);
        showError("Failed to load car data: " + e.message);
    }
}

function renderMetadata(data, id) {
    // Try to guess Name if displayName is missing
    const name = data.displayName || id.replace(/_/g, ' ').toUpperCase();
    els.metadata.title.innerText = name;
    els.metadata.subtitle.innerText = `${data.angleCount || 8} Angles • ${data.status || 'Draft'}`;
}

async function preloadImages(urlMap) {
    const promises = SPIN_ORDER.map((key, index) => {
        return new Promise((resolve, reject) => {
            const url = urlMap[key];
            if (!url) {
                console.warn(`Missing angle: ${key}`);
                resolve(null); // Skip but don't fail
                return;
            }

            const img = new Image();
            img.src = url;
            img.className = 'spinner-image';
            if (index === 0) img.classList.add('active'); // Show first

            img.onload = () => {
                els.canvas.appendChild(img);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load ${key}`);
                resolve(null);
            };

            // Store reference for JS manipulation
            images[index] = img;
        });
    });

    await Promise.all(promises);

    // Filter out missing ones (compact array)
    // Actually we keep holes to maintain rotation sanity? 
    // No, let's just filter nulls for now so index Logic works.
    images = images.filter(img => img !== null);

    if (images.length === 0) throw new Error("No valid images found for this car.");
}

function updateFrame(newIndex) {
    // Wrap around
    if (newIndex < 0) newIndex = images.length - 1;
    if (newIndex >= images.length) newIndex = 0;

    // DOM Update
    images[currentIndex].classList.remove('active');
    images[newIndex].classList.add('active');

    currentIndex = newIndex;
}

function setupInteraction() {
    const canvas = els.canvas;

    // Mouse / Touch Events
    const onStart = (e) => {
        isDragging = true;
        startX = e.pageX || e.touches[0].pageX;
        startIdx = currentIndex;
        canvas.style.cursor = 'grabbing';
    };

    const onMove = (e) => {
        if (!isDragging) return;
        const x = e.pageX || e.touches[0].pageX;
        const delta = x - startX;

        // Sensitivity: 20px per frame
        const frameDelta = Math.floor(-delta / 25);
        updateFrame(startIdx + frameDelta);
    };

    const onEnd = () => {
        isDragging = false;
        canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('mousedown', onStart);
    canvas.addEventListener('touchstart', onStart);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);

    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    // Buttons
    document.getElementById('prevBtn').onclick = () => updateFrame(currentIndex - 1);
    document.getElementById('nextBtn').onclick = () => updateFrame(currentIndex + 1);
}

function showError(msg) {
    els.loader.innerHTML = `<h3 class="error-message">${msg}</h3>`;
}

// Boot
init();
