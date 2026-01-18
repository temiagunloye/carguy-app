// src/screens/CarModelViewerScreen.tsx
// 3D car model viewer with turntable display using WebView + Three.js
// Updated to support Anchor-based Part Attachment

import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { generateCarModel } from '../services/cloudFunctions';
import { db } from '../services/firebaseConfig';
import { Part, partService } from '../services/PartService';
import type { RenderStatus } from '../types/car';

interface Props {
    navigation: any;
    route: {
        params: {
            carId?: string;
            carName?: string;
            modelUrl?: string;  // Direct URL bypasses Firestore
            baseModelId?: string;  // Load from baseModels collection
            photos?: string[];  // Optional photos from upload flow
            installedParts?: any[]; // Initial parts to load
        };
    };
}

export default function CarModelViewerScreen({ navigation, route }: Props) {
    const { carId, carName, modelUrl: paramModelUrl, baseModelId, photos, installedParts } = route.params;
    const webViewRef = useRef<WebView>(null);

    console.log('[CarModelViewer] Params:', { carId, carName, baseModelId, photoCount: photos?.length, parts: installedParts?.length });

    // Car document subscription
    const [renderStatus, setRenderStatus] = useState<RenderStatus>('draft');
    const [modelUrl, setModelUrl] = useState<string | null>(null);
    const [modelDataUrl, setModelDataUrl] = useState<string | null>(null);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch GLB and convert to data URL (bypass CORS)
    useEffect(() => {
        if (!modelUrl) return;

        console.log('[CarModelViewer] Fetching GLB from:', modelUrl);
        setLoading(true);

        fetch(modelUrl)
            .then(response => response.blob())
            .then(blob => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    console.log('[CarModelViewer] GLB converted to data URL');
                    setModelDataUrl(base64);
                    setLoading(false);
                };
                reader.readAsDataURL(blob);
            })
            .catch(error => {
                console.error('[CarModelViewer] Failed to fetch GLB:', error);
                setRenderError('Failed to load 3D model');
                setLoading(false);
            });
    }, [modelUrl]);

    // FETCH BASE MODEL if baseModelId provided
    useEffect(() => {
        if (!baseModelId || !db) return;

        console.log('[CarModelViewer] Fetching base model:', baseModelId);

        const baseModelRef = doc(db, 'baseModels', baseModelId);
        const unsubscribe = onSnapshot(baseModelRef, (snapshot) => {
            if (snapshot.exists()) {
                const baseModel = snapshot.data();
                console.log('[CarModelViewer] Base model loaded:', baseModel.displayName);
                setModelUrl(baseModel.glbUrl);
                setRenderStatus('ready');
                setLoading(false);
            } else {
                console.error('[CarModelViewer] Base model not found:', baseModelId);
                setLoading(false);
                setRenderError('Base model not found');
            }
        }, (error) => {
            console.error('[CarModelViewer] Error fetching base model:', error);
            setLoading(false);
            setRenderError(error.message);
        });

        return () => unsubscribe();
    }, [baseModelId]);

    // SUBSCRIBE TO CAR DOCUMENT (skip if modelUrl or baseModelId provided)
    useEffect(() => {
        // If modelUrl provided directly, use it
        if (paramModelUrl) {
            console.log('[CarModelViewer] Using param modelUrl:', paramModelUrl);
            setModelUrl(paramModelUrl);
            setRenderStatus('ready');
            setLoading(false);
            return;
        }

        // If baseModelId provided, skip car document subscription
        if (baseModelId) {
            return;
        }

        if (!carId || !db) return;

        const carRef = doc(db, 'cars', carId);
        const unsubscribe = onSnapshot(carRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setRenderStatus(data.renderStatus || 'draft');
                setModelUrl(data.modelUrl || null);
                setRenderError(data.renderError || null);
                setLoading(false);
            } else {
                setLoading(false);
                Alert.alert('Error', 'Car not found');
            }
        }, (error) => {
            console.error('[CarModelViewer] Firestore error:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to load car data');
        });

        return () => unsubscribe();
    }, [carId, paramModelUrl]);

    // LOAD INSTALLED PARTS
    useEffect(() => {
        if (!installedParts || installedParts.length === 0 || loading || !webViewRef.current) return;

        // This effect runs when installedParts prop changes, but we likely need to 
        // trigger this from the onLoad handler of the WebView to ensure scene is ready.
        // See generateViewerHTML sendMessage handlers.
    }, [installedParts, loading]);

    // Load parts function to call from WebView onload
    const loadInitialParts = async () => {
        if (installedParts && installedParts.length > 0) {
            console.log('[CarModelViewer] Loading initial parts...', installedParts);
            for (const item of installedParts) {
                try {
                    const part = await partService.getPartById(item.partId);
                    if (part) {
                        const glbUrl = await partService.resolvePartGlbUrl(part);
                        injectPart(part, glbUrl, item.config);
                    }
                } catch (e) {
                    console.error('Failed to load part:', item.partId, e);
                }
            }
        }
    };

    const injectPart = (part: Part, glbUrl: string, config: any) => {
        if (!webViewRef.current) return;

        const payload = {
            type: 'LOAD_PART',
            part,
            glbUrl,
            config
        };
        webViewRef.current.postMessage(JSON.stringify(payload));
    };

    // RETRY GENERATION
    const handleRetry = async () => {
        if (!carId) {
            Alert.alert('Error', 'Car ID is missing');
            return;
        }
        try {
            setLoading(true);
            await generateCarModel({ carId, photoPaths: photos || [] });
            Alert.alert('Processing Restarted', 'Your 3D model generation has been restarted.');
        } catch (error: any) {
            console.error('[CarModelViewer] Retry failed:', error);
            Alert.alert('Retry Failed', error.message);
        } finally {
            setLoading(false);
        }
    };

    // GENERATE HTML FOR WEBVIEW 3D VIEWER
    const generateViewerHTML = (glbUrl: string) => {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>3D Car Viewer</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 100vw; height: 100vh; overflow: hidden; background: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    #canvas-container { width: 100%; height: 100%; }
    #loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #fff; font-size: 16px; text-align: center; }
    .spinner { border: 3px solid rgba(255,255,255,0.1); border-top: 3px solid #4a9eff; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div id="loading">
    <div class="spinner"></div>
    <div>Loading 3D model...</div>
  </div>
  <div id="canvas-container"></div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/DRACOLoader.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>

  <script>
    // --- SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(4, 2, 6);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.2, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.3, roughness: 0.7 });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.1;
    platform.receiveShadow = true;
    scene.add(platform);

    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.5, 0);
    const polarAngle = Math.PI / 2.5; 
    controls.minPolarAngle = polarAngle;
    controls.maxPolarAngle = polarAngle;
    controls.update();

    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
    dracoLoader.setDecoderConfig({ type: 'wasm' });
    dracoLoader.preload();

    const loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    // --- STATE ---
    let carModel = null;
    let autoRotate = true;
    const anchorMap = {}; // { anchorName: Object3D } (The actual anchor nodes in the car)
    const attachedParts = {}; // { partId: Object3D }

    // --- MESSAGING ---
    function sendMessage(msg) {
      if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(msg));
      console.log(msg);
    }
    
    function sendLog(text) { sendMessage({ type: 'LOG', message: text }); }

    // --- PART LOADING LOGIC ---
    function findAnchors(object) {
        object.traverse((node) => {
            if (node.name && node.name.startsWith('ANCHOR_')) {
                anchorMap[node.name] = node;
                // Visualize anchor (debug)
                // const helper = new THREE.AxesHelper(0.2);
                // node.add(helper);
                sendLog('Found anchor: ' + node.name);
            }
        });
    }

    // --- METRICS & SCALING ---
    function getCarMetrics() {
        if (!anchorMap['ANCHOR_WHEEL_FL'] || !anchorMap['ANCHOR_WHEEL_FR']) return null;
        
        const fl = anchorMap['ANCHOR_WHEEL_FL'].position;
        const fr = anchorMap['ANCHOR_WHEEL_FR'].position;
        const rl = anchorMap['ANCHOR_WHEEL_RL'] ? anchorMap['ANCHOR_WHEEL_RL'].position : null;

        // Track Width (Width between front wheels)
        const trackWidth = Math.abs(fr.x - fl.x); // X-axis width
        
        // Wheelbase (Length between front/rear)
        const wheelbase = rl ? Math.abs(fl.y - rl.y) : trackWidth * 1.6; // Y-axis length (Blender Y-up/Z-forward varies, assume Y is length based on add_anchors.py)
                                                                       // Actually add_anchors used Y for length.
        
        // Car Width (Approx based on anchors or bounding box)
        // We can use the side anchors if available
        let carWidth = trackWidth * 1.1; // Fallback
        if (anchorMap['ANCHOR_SIDE_LEFT_LOW'] && anchorMap['ANCHOR_SIDE_RIGHT_LOW']) {
            carWidth = Math.abs(anchorMap['ANCHOR_SIDE_RIGHT_LOW'].position.x - anchorMap['ANCHOR_SIDE_LEFT_LOW'].position.x);
        }

        return { trackWidth, wheelbase, carWidth };
    }

    function attachPart(partData, glbUrl, config) {
        sendLog('Attaching part: ' + partData.name);
        
        loader.load(glbUrl, (gltf) => {
            const partScene = gltf.scene;
            const placement = partData.placementDefaults;
            const targetPattern = placement.anchorPattern || placement.anchorName;

            // Find matching anchors
            const targets = [];
            if (targetPattern && targetPattern.endsWith('*')) {
                const prefix = targetPattern.replace('*', '');
                Object.keys(anchorMap).forEach(key => {
                    if (key.startsWith(prefix)) targets.push(anchorMap[key]);
                });
            } else if (targetPattern && anchorMap[targetPattern]) {
                targets.push(anchorMap[targetPattern]);
            }

            if (targets.length === 0) {
                sendLog('No matching anchors found for ' + targetPattern);
                return;
            }

            // Calculate Scale
            const metrics = getCarMetrics();
            let finalScale = partData.meta.defaultScale || 1.0;
            
            if (metrics) {
                if (placement.scaleMode === 'relativeToCarWidth') {
                    // Assume part is designed for ~1.8m width, scale to actual car width
                    // Or simpler: We assume the part GLB width (X) matches 1 unit? 
                    // No, "relative" usually means matching the target dimension.
                    // If part is 2m wide and car is 2m, scale 1.
                    // If part is 1m wide generic (placeholder), scale to carWidth.
                    // We'll use the part dimensions from meta if available, else 1.0
                    const partWidthMm = partData.meta.dimensionsMm?.x || 1000; 
                    const partWidthM = partWidthMm / 1000;
                    if (partWidthM > 0) {
                        finalScale = metrics.carWidth / partWidthM;
                        sendLog('Scaled to Car Width: ' + finalScale.toFixed(2));
                    }
                } else if (placement.scaleMode === 'relativeToWheelbase') {
                    const partLengthMm = partData.meta.dimensionsMm?.y || 2600; // Default wheelbase approx
                    const partLengthM = partLengthMm / 1000;
                     // Side skirts usually Y-axis length
                     // If explicit dimension known:
                     if (partLengthM > 0) {
                         finalScale = metrics.wheelbase / partLengthM;
                         sendLog('Scaled to Wheelbase: ' + finalScale.toFixed(2));
                     }
                }
            }

            // Clone part for multiple anchors
            targets.forEach(anchor => {
                // If part is already attached to this anchor (cleanup old), handled by React logic mostly but good to check
                // For now, simple add.
                
                const instance = partScene.clone();
                
                // Transforms
                instance.scale.setScalar(finalScale);
                
                // Rotations (Degrees -> Radians usually, but check if data is rads)
                // Assuming degrees from manual input, convert to rads
                // If already rads, keep. Assuming 0,0,0 defaults are fine.
                // Standard Three.js uses Radians.
                instance.rotation.set(
                    placement.rotation.x,
                    placement.rotation.y,
                    placement.rotation.z
                );
                
                // Position Offset
                instance.position.set(
                    placement.offset.x,
                    placement.offset.y,
                    placement.offset.z
                );

                // Add to anchor
                anchor.add(instance);
                attachedParts[partData.partId + '_' + anchor.name] = instance;
            });

            sendLog('Part attached successfully! (' + targets.length + ' anchors)');

        }, undefined, (err) => {
            sendLog('Error loading part GLB: ' + err.message);
        });
    }

    // --- CAR LOADING ---
    loader.load(
      '${glbUrl}',
      (gltf) => {
        carModel = gltf.scene;
        
        // 1. Center and Scale Car
        const box = new THREE.Box3().setFromObject(carModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const container = new THREE.Group();
        carModel.position.x = -center.x;
        carModel.position.y = -center.y;
        carModel.position.z = -center.z;
        container.add(carModel);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        container.scale.setScalar(scale);
        container.position.y = (size.y * scale) / 2;
        container.castShadow = true;
        container.receiveShadow = true;
        scene.add(container);
        carModel = container; // Update ref for rotation

        // 2. Find Anchors
        findAnchors(carModel);

        // 3. Signal Ready
        document.getElementById('loading').style.display = 'none';
        sendMessage({ type: 'SCENE_READY' });
      },
      (xhr) => {
        const percent = (xhr.loaded / xhr.total * 100).toFixed(0);
        sendMessage({ type: 'PROGRESS', value: percent });
      },
      (error) => {
        sendMessage({ type: 'ERROR', message: error.message });
        document.getElementById('loading').innerHTML = 'Failed to load model';
      }
    );

    // --- MAIN LOOP ---
    function animate() {
      requestAnimationFrame(animate);
      if (autoRotate) {
        platform.rotation.y += 0.005;
        if (carModel) carModel.rotation.y += 0.005;
      }
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // --- EVENT LISTENERS ---
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    controls.addEventListener('start', () => { autoRotate = false; });

    // --- RN BRIDGE ---
    document.addEventListener("message", function(event) {
       try {
           const data = JSON.parse(event.data);
           if (data.type === 'LOAD_PART') {
               attachPart(data.part, data.glbUrl, data.config);
           }
       } catch (e) {
           sendLog('Message parse error: ' + e.message);
       }
    });

    // iOS specific bridge
    window.addEventListener("message", function(event) {
        // Handle if sent via window (sometimes different on platforms)
    });
  </script>
</body>
</html>
    `;
    };

    // RENDER STATUS VIEWS
    const renderStatusView = () => {
        if (loading) {
            return (
                <View style={styles.statusContainer}>
                    <ActivityIndicator size="large" color="#4a9eff" />
                    <Text style={styles.statusText}>Loading...</Text>
                </View>
            );
        }

        if (renderStatus === 'error') {
            return (
                <View style={styles.statusContainer}>
                    <Ionicons name="alert-circle" size={64} color="#ef4444" />
                    <Text style={styles.errorText}>Generation Failed</Text>
                    {renderError && (
                        <Text style={styles.errorSubtext}>{renderError}</Text>
                    )}
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                        <Ionicons name="refresh" size={20} color="#fff" />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (!modelUrl) {
            return (
                <View style={styles.statusContainer}>
                    <Ionicons name="alert-circle" size={64} color="#f59e0b" />
                    <Text style={styles.statusText}>Model URL Missing</Text>
                </View>
            );
        }

        return null;
    };

    const statusView = renderStatusView();

    // Handle WebView messages
    const onWebViewMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'LOG') {
                console.log('[WebView Log]', data.message);
            } else if (data.type === 'SCENE_READY') {
                console.log('[CarModelViewer] Scene ready, loading parts...');
                loadInitialParts();
            } else if (data.type === 'ERROR') {
                console.error('[WebView Error]', data.message);
            }
        } catch (e) {
            // Might be a raw string
            console.log('[WebView Raw]', event.nativeEvent.data);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{carName || '3D Model'}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* 3D Viewer or Status */}
            {statusView ? (
                statusView
            ) : modelDataUrl ? (
                <WebView
                    ref={webViewRef}
                    style={styles.webView}
                    source={{ html: generateViewerHTML(modelDataUrl) }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowFileAccess={true}
                    originWhitelist={['*']}
                    onMessage={onWebViewMessage}
                    onError={(e) => console.error('[CarModelViewer] WebView error:', e.nativeEvent)}
                />
            ) : (
                <View style={styles.statusContainer}>
                    <ActivityIndicator size="large" color="#4a9eff" />
                    <Text style={styles.statusText}>Loading 3D model...</Text>
                </View>
            )}

            {/* Info */}
            {renderStatus === 'ready' && modelDataUrl && (
                <View style={styles.infoBox}>
                    <Ionicons name="information-circle-outline" size={18} color="#4a9eff" />
                    <Text style={styles.infoText}>
                        Auto-rotates. Drag to orbit • Pinch to zoom
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0a0a0a' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: '#000' },
    headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
    webView: { flex: 1, backgroundColor: '#1a1a1a' },
    statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    statusText: { color: '#fff', fontSize: 20, fontWeight: '600', marginTop: 16, textAlign: 'center' },
    statusSubtext: { color: '#999', fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
    errorText: { color: '#ef4444', fontSize: 20, fontWeight: '600', marginTop: 16 },
    errorSubtext: { color: '#ef4444', fontSize: 14, marginTop: 8, textAlign: 'center' },
    retryButton: { backgroundColor: '#4a9eff', flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 24 },
    retryButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 },
    infoBox: { flexDirection: 'row', backgroundColor: '#0a0a0a', borderRadius: 8, padding: 12, margin: 16, borderWidth: 1, borderColor: '#1a1a1a', alignItems: 'center' },
    infoText: { flex: 1, color: '#a0a0a0', fontSize: 12, marginLeft: 10 },
});
