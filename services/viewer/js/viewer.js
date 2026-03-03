import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controls;

async function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0a);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // Grid
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    try {
        // Fetch which job to load
        const configRes = await fetch('latest_job.json');
        const config = await configRes.json();
        const jobPath = config.path;

        document.getElementById('job-id').textContent = `Job: ${config.id}`;

        // Load Proxy Mesh
        const loader = new GLTFLoader();
        const proxyUrl = `../../${jobPath}/proxy/proxy.glb`;
        document.getElementById('proxy-url').textContent = proxyUrl.split('/').pop();

        loader.load(proxyUrl, (gltf) => {
            const model = gltf.scene;
            scene.add(model);
            console.log("Loaded proxy mesh", proxyUrl);

            // Robust Visibility Guarantee
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // 1. Center it
            model.position.sub(center);

            // 2. Scale to ~4.0 units max dimension
            const maxDim = Math.max(size.x, size.y, size.z);
            let scaleFactor = 1.0;
            if (maxDim > 0) {
                scaleFactor = 4.0 / maxDim;
                model.scale.multiplyScalar(scaleFactor);
            }

            // 3. Update UI
            document.getElementById('proxy-bbox').textContent = `${size.x.toFixed(2)}, ${size.y.toFixed(2)}, ${size.z.toFixed(2)}`;
            document.getElementById('proxy-maxdim').textContent = maxDim.toFixed(2);
            document.getElementById('proxy-scale').textContent = scaleFactor.toFixed(4);

            // 4. Frame Camera + OrbitControls
            const dist = Math.min(Math.max(maxDim * scaleFactor * 2.5, 2), 50);
            camera.position.set(dist, dist * 0.6, dist);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();

            console.log(`Auto-framed model: size=${maxDim}, scale=${scaleFactor.toFixed(4)}, dist=${dist.toFixed(2)}`);
        });

        // Load Poses
        const posesRes = await fetch(`../../${jobPath}/colmap/poses.json`);
        const posesData = await posesRes.json();
        document.getElementById('poses-count').textContent = `${posesData.frameCount} poses registered`;

        const poseGroup = new THREE.Group();
        posesData.frames.forEach(frame => {
            const axes = new THREE.AxesHelper(0.2);
            const q = new THREE.Quaternion(frame.rotation[1], frame.rotation[2], frame.rotation[3], frame.rotation[0]);
            const pos = new THREE.Vector3(frame.position[0], frame.position[1], frame.position[2]);
            const rotMatrix = new THREE.Matrix4().makeRotationFromQuaternion(q);
            const worldPos = pos.clone().applyMatrix4(rotMatrix.transpose()).multiplyScalar(-1);

            axes.position.copy(worldPos);
            axes.setRotationFromQuaternion(q.clone().invert());
            poseGroup.add(axes);
        });
        scene.add(poseGroup);

        // Splat Integration (Phase H)
        try {
            const manifestRes = await fetch(`../../${jobPath}/package/model_manifest.json`);
            if (manifestRes.ok) {
                const manifest = await manifestRes.json();
                if (manifest.splat) {
                    if (manifest.splat.exists && manifest.splat.artifactPath) {
                        const splatHtml = `
                        <div id="splat-banner" style="margin-top: 15px; padding: 10px; background: rgba(56, 189, 248, 0.1); border: 1px solid #38bdf8; border-radius: 6px;">
                            <div style="color: #38bdf8; font-weight: bold; margin-bottom: 5px;">Gaussian Splat Model Detected</div>
                            <div style="font-size: 11px; color: #ccc; margin-bottom: 10px;">
                                Artifact: ${manifest.splat.artifactPath.split('/').pop()}<br>
                                Size: ${(manifest.splat.sizeBytes / 1024 / 1024).toFixed(2)} MB
                            </div>
                            <a href="${manifest.splat.viewerUrl}" target="_blank" style="display: inline-block; padding: 6px 12px; background: #38bdf8; color: #000; text-decoration: none; font-size: 12px; font-weight: bold; border-radius: 4px;">Open Photoreal Model</a>
                        </div>
                        `;
                        // Insert splat banner before debug info if it exists
                        const ui = document.getElementById('ui');
                        const debugInfo = document.getElementById('debug-info');
                        if (debugInfo) {
                            debugInfo.insertAdjacentHTML('beforebegin', splatHtml);
                        } else {
                            ui.insertAdjacentHTML('beforeend', splatHtml);
                        }
                    } else if (manifest.splat.exists === false || !manifest.splat.artifactPath) {
                        const fallbackHtml = `
                        <div style="margin-top: 15px; padding: 10px; background: rgba(248, 113, 113, 0.1); border: 1px solid #f87171; border-radius: 6px; font-size: 11px; color: #fca5a5;">
                            Splat invalid &mdash; falling back to proxy
                        </div>
                        `;
                        const ui = document.getElementById('ui');
                        const debugInfo = document.getElementById('debug-info');
                        if (debugInfo) {
                            debugInfo.insertAdjacentHTML('beforebegin', fallbackHtml);
                        } else {
                            ui.insertAdjacentHTML('beforeend', fallbackHtml);
                        }
                    }
                }
            }
        } catch (manifestErr) {
            console.warn("Could not load model_manifest.json", manifestErr);
        }

    } catch (err) {
        console.error("Error loading job data:", err);
        document.getElementById('job-id').textContent = "Error loading data";
    }

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
