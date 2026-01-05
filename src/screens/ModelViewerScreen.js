// src/screens/ModelViewerScreen.js
// 3D Model Viewer using KIRI Engine WebView

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { WebView } from 'react-native-webview';

export default function ModelViewerScreen({ navigation, route }) {
    const { viewerUrl, carName } = route.params || {};
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    if (!viewerUrl) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={64} color="#ef4444" />
                    <Text style={styles.errorTitle}>No 3D Model Available</Text>
                    <Text style={styles.errorText}>
                        The 3D model URL is missing. Please try regenerating the model.
                    </Text>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {carName || '3D Model Viewer'}
                </Text>
                <TouchableOpacity
                    onPress={() => {
                        Alert.alert(
                            '3D Model Controls',
                            '• Drag to rotate\n• Pinch to zoom\n• Two-finger drag to pan',
                            [{ text: 'Got it' }]
                        );
                    }}
                >
                    <Ionicons name="information-circle-outline" size={24} color="#ffffff" />
                </TouchableOpacity>
            </View>

            {/* WebView */}
            <WebView
                source={{ uri: viewerUrl }}
                style={styles.webview}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                    setLoading(false);
                    setError(true);
                }}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                allowsInlineMediaPlayback={true}
            />

            {/* Loading Overlay */}
            {loading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#22c55e" />
                    <Text style={styles.loadingText}>Loading 3D model...</Text>
                </View>
            )}

            {/* Error Overlay */}
            {error && (
                <View style={styles.errorOverlay}>
                    <Ionicons name="alert-circle" size={48} color="#ef4444" />
                    <Text style={styles.errorTitle}>Failed to Load Model</Text>
                    <Text style={styles.errorText}>
                        Please check your internet connection and try again.
                    </Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={() => {
                            setError(false);
                            setLoading(true);
                        }}
                    >
                        <Ionicons name="refresh" size={20} color="#fff" style={{ marginRight: 8 }} />
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Info Footer */}
            <View style={styles.footer}>
                <View style={styles.infoBox}>
                    <Ionicons name="hand-right-outline" size={16} color="#4a9eff" />
                    <Text style={styles.infoText}>
                        Drag to rotate • Pinch to zoom • Powered by KIRI Engine
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
        backgroundColor: '#000000',
    },
    headerTitle: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
        marginHorizontal: 16,
    },
    webview: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#a0a0a0',
        fontSize: 14,
        marginTop: 12,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    errorTitle: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorText: {
        color: '#a0a0a0',
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    backButton: {
        backgroundColor: '#4a9eff',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    backButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    retryButton: {
        backgroundColor: '#22c55e',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
    },
    retryButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#000000',
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoText: {
        color: '#a0a0a0',
        fontSize: 12,
        marginLeft: 8,
    },
});
