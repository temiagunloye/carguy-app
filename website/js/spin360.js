/**
 * spin360.js - Lead Engineer Implementation
 * Carvana/TrueCar-style 360 spin controller for the car visualizer.
 */

export function attachSpinController({
    imgEl,
    setAngleFn,
    getAngleIndexFn,
    isRenderPendingFn,
    frameCount = 10,
    debug = false
}) {
    if (!imgEl) return;

    const DRAG_STEP_PX = 32;
    let isDragging = false;
    let startX = 0;
    let startIndex = 0;
    let lastMoveTime = 0;
    let velocity = 0; // delta frames per ms? No, let's stick to pixel velocity then map to steps
    let lastX = 0;
    let rafId = null;

    // Similarity Guard Cache
    const sizeCache = new Map();

    // Prevent default dragging/selection
    imgEl.draggable = false;
    imgEl.style.userSelect = 'none';
    imgEl.style.webkitUserSelect = 'none';
    imgEl.style.cursor = 'grab';
    imgEl.style.touchAction = 'none';

    function wrap(index, count) {
        return ((index % count) + count) % count;
    }

    function preloadAdjacent(index) {
        if (isRenderPendingFn()) return;

        const currentSrc = imgEl.src;
        if (!currentSrc) return;

        // Extract base path to angle_XX.png
        const baseDir = currentSrc.substring(0, currentSrc.lastIndexOf('/') + 1);
        const urlParams = currentSrc.substring(currentSrc.lastIndexOf('?'));

        // Preload ±2 frames
        [-2, -1, 1, 2].forEach(offset => {
            const targetIndex = wrap(index + offset, frameCount);
            const padIndex = (targetIndex + 1).toString().padStart(2, '0');
            const url = `${baseDir}angle_${padIndex}.png${urlParams}`;

            const img = new Image();
            img.src = url;
            if (img.decode) img.decode().catch(() => { });
        });
    }

    function checkSimilarity(index, url) {
        if (!debug || !window.performance || !window.performance.getEntriesByName) return;

        const entry = performance.getEntriesByName(url).pop();
        if (!entry) return;

        const size = entry.encodedBodySize || entry.decodedBodySize;
        if (size === 0) return;

        const buildId = url.split('/')[3];

        // Check neighbors
        for (let i = 1; i <= frameCount; i++) {
            if (i === (index + 1)) continue;
            const otherAngle = `angle_${i.toString().padStart(2, '0')}`;
            const otherUrl = url.replace(/angle_\d+/, otherAngle);

            if (sizeCache.has(otherUrl) && sizeCache.get(otherUrl) === size) {
                console.warn(`[DEBUG] Angle Similarity Warning: ${url.split('/').pop()} and ${otherAngle}.png may be duplicates (buildId=${buildId})`);
            }
        }
        sizeCache.set(url, size);
    }

    imgEl.addEventListener('load', () => {
        const index = getAngleIndexFn();
        const url = imgEl.src;
        checkSimilarity(index, url);
    });

    function handleStart(e) {
        if (isRenderPendingFn()) return;
        isDragging = true;
        startX = e.clientX;
        lastX = e.clientX;
        startIndex = getAngleIndexFn();
        lastMoveTime = Date.now();
        velocity = 0;

        imgEl.setPointerCapture(e.pointerId);
        imgEl.style.cursor = 'grabbing';
    }

    function handleMove(e) {
        if (!isDragging) return;

        const currentX = e.clientX;
        const now = Date.now();
        const dt = now - lastMoveTime;
        const dx = currentX - lastX;

        if (dt > 0) {
            velocity = dx / dt;
        }

        lastX = currentX;
        lastMoveTime = now;

        const deltaTotal = currentX - startX;
        const steps = Math.trunc(deltaTotal / DRAG_STEP_PX);
        const newIndex = wrap(startIndex - steps, frameCount);

        if (newIndex !== getAngleIndexFn()) {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                setAngleFn(newIndex);
                preloadAdjacent(newIndex);
            });
        }
    }

    function handleEnd() {
        if (!isDragging) return;
        isDragging = false;
        imgEl.style.cursor = 'grab';

        // Light Inertia
        if (Math.abs(velocity) > 0.4) {
            const framesToAdvance = Math.min(2, Math.max(1, Math.round(Math.abs(velocity) * 1.5)));
            const direction = velocity > 0 ? -1 : 1;

            let count = 0;
            const step = () => {
                if (count < framesToAdvance) {
                    const next = wrap(getAngleIndexFn() + direction, frameCount);
                    setAngleFn(next);
                    count++;
                    setTimeout(step, 80 + (count * 40)); // Smoothly decelerate
                }
            };
            setTimeout(step, 50);
        }
    }

    imgEl.addEventListener('pointerdown', handleStart);
    imgEl.addEventListener('pointermove', handleMove);
    imgEl.addEventListener('pointerup', handleEnd);
    imgEl.addEventListener('pointercancel', handleEnd);

    // Keyboard accessibility
    window.addEventListener('keydown', (e) => {
        if (isRenderPendingFn()) return;
        if (e.key === 'ArrowRight') {
            setAngleFn(wrap(getAngleIndexFn() + 1, frameCount));
        } else if (e.key === 'ArrowLeft') {
            setAngleFn(wrap(getAngleIndexFn() - 1, frameCount));
        }
    });

    console.log("360 Spin Controller Attached (v2 - Lead Spec).");
}
