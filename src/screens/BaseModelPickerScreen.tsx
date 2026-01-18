// src/screens/BaseModelPickerScreen.tsx
// Screen to select a base car model after photo upload or from showroom

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useBaseModels } from '../hooks/useBaseModels';
import type { BaseModelSnapshot } from '../types/BaseModel';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 40;

type Props = {
    navigation: any;
    route: {
        params?: {
            carId?: string;
            photos?: string[];
        };
    };
};

export default function BaseModelPickerScreen({ navigation, route }: Props) {
    const { models, loading, error } = useBaseModels();
    const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
    const { carId, photos } = route.params || {};

    console.log('[BaseModelPicker] Loaded with:', { carId, photoCount: photos?.length });

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading base models...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Ionicons name="alert-circle" size={48} color="#FF3B30" />
                <Text style={styles.errorText}>Failed to load models</Text>
                <Text style={styles.errorDetail}>{error.message}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.retryButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (models.length === 0) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyText}>No base models available</Text>
            </View>
        );
    }

    const handleModelSelect = (model: BaseModelSnapshot) => {
        console.log('[BaseModelPicker] Selected model:', model.data.modelId);

        // Navigate to viewer with selected base model
        navigation.navigate('CarModelViewerScreen', {
            baseModelId: model.id,
            carId: carId,
            photos: photos,
            carName: model.data.displayName,
        });
    };

    const generateModelViewerHTML = (glbUrl: string) => {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <script type="module" src="https://unpkg.com/@google/model-viewer@3.3.0/dist/model-viewer.min.js"></script>
  <style>
    body { margin: 0; padding: 0; overflow: hidden; }
    model-viewer {
      width: 100%;
      height: 100%;
      background: linear-gradient(#e0e0e0, #f0f0f0);
    }
  </style>
</head>
<body>
  <model-viewer
    src="${glbUrl}"
    alt="Car model"
    camera-controls
    camera-orbit="45deg 75deg 4m"
    disable-zoom
    loading="eager"
  ></model-viewer>
</body>
</html>
    `;
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Select Base Model</Text>
                <View style={{ width: 40 }} />
            </View>

            <Text style={styles.subtitle}>
                {photos ? 'Choose the closest match to your car' : 'Select a model to view'}
            </Text>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + 20}
                decelerationRate="fast"
                contentContainerStyle={styles.scrollContent}
            >
                {models.map((model, index) => (
                    <View key={model.id} style={styles.modelCard}>
                        <View style={styles.viewerContainer}>
                            <WebView
                                source={{ html: generateModelViewerHTML(model.data.glbUrl) }}
                                style={styles.webView}
                                scrollEnabled={false}
                                bounces={false}
                            />
                        </View>

                        <View style={styles.modelInfo}>
                            <Text style={styles.modelName}>{model.data.displayName}</Text>
                            <Text style={styles.modelDetails}>
                                {model.data.year} • {model.data.bodyStyle}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.selectButton,
                                selectedModelId === model.id && styles.selectedButton
                            ]}
                            onPress={() => handleModelSelect(model)}
                        >
                            <Text style={styles.selectButtonText}>Use This Model</Text>
                        </TouchableOpacity>
                    </View>
                ))}
            </ScrollView>
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
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 50,
        backgroundColor: '#000',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginVertical: 16,
        paddingHorizontal: 20,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    modelCard: {
        width: CARD_WIDTH,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        marginRight: 20,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    viewerContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#2a2a2a',
    },
    webView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    modelInfo: {
        padding: 16,
    },
    modelName: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    modelDetails: {
        fontSize: 14,
        color: '#888',
    },
    selectButton: {
        backgroundColor: '#007AFF',
        margin: 16,
        marginTop: 0,
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    selectedButton: {
        backgroundColor: '#34C759',
    },
    selectButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#0a0a0a',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#888',
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FF3B30',
        marginTop: 16,
    },
    errorDetail: {
        fontSize: 14,
        color: '#888',
        marginTop: 8,
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 24,
        paddingHorizontal: 24,
        paddingVertical: 12,
        backgroundColor: '#007AFF',
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
    },
});
