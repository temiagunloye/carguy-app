// src/screens/CarModelViewerScreen.tsx
// 3D car model viewer with turntable display using WebView + Three.js

import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
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
        };
    };
}

export default function CarModelViewerScreen({ navigation, route }: Props) {
    const { carId, carName, modelUrl: paramModelUrl, baseModelId, photos } = route.params;

    console.log('[CarModelViewer] Params:', { carId, carName, baseModelId, photoCount: photos?.length });

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
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      width: 100vw;
      height: 100vh;
      overflow: hidden;
      background: #1a1a1a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    #canvas-container {
      width: 100%;
      height: 100%;
    }
    #loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #fff;
      font-size: 16px;
      text-align: center;
    }
    .spinner {
      border: 3px solid rgba(255,255,255,0.1);
      border-top: 3px solid #4a9eff;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
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
    // Setup scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(4, 2, 6);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Lights
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Turntable platform
    const platformGeometry = new THREE.CylinderGeometry(3, 3, 0.2, 32);
    const platformMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.3,
      roughness: 0.7,
    });
    const platform = new THREE.Mesh(platformGeometry, platformMaterial);
    platform.position.y = -0.1;
    platform.receiveShadow = true;
    scene.add(platform);

    // Orbit controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0.5, 0);
    
    // Lock vertical rotation - only allow horizontal 360° spin
    const polarAngle = Math.PI / 2.5; // Fixed angle ~75 degrees
    controls.minPolarAngle = polarAngle;
    controls.maxPolarAngle = polarAngle;
    
    controls.update();

    // Setup Draco decoder for compressed models
    const dracoLoader = new THREE.DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.4.1/');
    dracoLoader.setDecoderConfig({ type: 'wasm' });
    dracoLoader.preload();

    // Load GLB model
    const loader = new THREE.GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    let carModel = null;
    let autoRotate = true;

    // Send messages to React Native
    function sendMessage(msg) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(msg);
      }
      console.log(msg);
    }

    sendMessage('[WebView] Starting to load model from: ${glbUrl}');

    loader.load(
      '${glbUrl}',
      (gltf) => {
        sendMessage('[WebView] Model loaded successfully!');
        carModel = gltf.scene;

        // Calculate bounding box BEFORE any transformations
        const box = new THREE.Box3().setFromObject(carModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Create a container group for proper centering
        const container = new THREE.Group();
        
        // Move model so its center is at the container's origin
        carModel.position.x = -center.x;
        carModel.position.y = -center.y;
        carModel.position.z = -center.z;
        
        // Add model to container
        container.add(carModel);

        // Scale the container to fit
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2 / maxDim;
        container.scale.setScalar(scale);
        
        // Position container so bottom sits on platform
        // After scaling, the model height is size.y * scale
        const scaledHeight = size.y * scale;
        container.position.y = scaledHeight / 2;

        container.castShadow = true;
        container.receiveShadow = true;

        scene.add(container);
        
        // Update carModel reference to container for rotation
        carModel = container;
        document.getElementById('loading').style.display = 'none';
        sendMessage('[WebView] Model added to scene');
      },
      (progress) => {
        const percent = (progress.loaded / progress.total) * 100;
        sendMessage('[WebView] Loading progress: ' + percent.toFixed(0) + '%');
      },
      (error) => {
        const errorMsg = '[WebView] GLB load error: ' + (error.message || error.toString());
        sendMessage(errorMsg);
        console.error('GLB load error:', error);
        document.getElementById('loading').innerHTML = 
          '<div>Failed to load 3D model</div><div style="font-size: 12px; margin-top: 8px;">Check console for details</div>';
      }
    );

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);

      // Auto-rotate platform
      if (autoRotate) {
        platform.rotation.y += 0.005;
        if (carModel) {
          carModel.rotation.y += 0.005;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    // Handle resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Disable auto-rotate on user interaction
    controls.addEventListener('start', () => {
      autoRotate = false;
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

        if (renderStatus === 'pending') {
            return (
                <View style={styles.statusContainer}>
                    <Ionicons name="time-outline" size={64} color="#f59e0b" />
                    <Text style={styles.statusText}>Queued</Text>
                    <Text style={styles.statusSubtext}>
                        Your 3D model is queued for processing
                    </Text>
                </View>
            );
        }

        if (renderStatus === 'processing') {
            return (
                <View style={styles.statusContainer}>
                    <ActivityIndicator size="large" color="#4a9eff" />
                    <Text style={styles.statusText}>Generating accurate model...</Text>
                    <Text style={styles.statusSubtext}>
                        This may take 10-30 minutes.{'\n'}We prioritize accuracy over speed.
                    </Text>
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
                    <Text style={styles.statusSubtext}>
                        Status is ready but modelUrl is null
                    </Text>
                </View>
            );
        }

        return null;
    };

    const statusView = renderStatusView();

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
                    style={styles.webView}
                    source={{ html: generateViewerHTML(modelDataUrl) }}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                    allowFileAccess={true}
                    onMessage={(event) => {
                        console.log('[CarModelViewer] WebView message:', event.nativeEvent.data);
                    }}
                    onError={(e) => {
                        console.error('[CarModelViewer] WebView error:', e.nativeEvent);
                    }}
                    onHttpError={(e) => {
                        console.error('[CarModelViewer] WebView HTTP error:', e.nativeEvent);
                    }}
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
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
        backgroundColor: '#000',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    webView: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    statusContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    statusText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    },
    statusSubtext: {
        color: '#999',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
    },
    errorSubtext: {
        color: '#ef4444',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: '#4a9eff',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 24,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#0a0a0a',
        borderRadius: 8,
        padding: 12,
        margin: 16,
        borderWidth: 1,
        borderColor: '#1a1a1a',
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        color: '#a0a0a0',
        fontSize: 12,
        marginLeft: 10,
    },
});
