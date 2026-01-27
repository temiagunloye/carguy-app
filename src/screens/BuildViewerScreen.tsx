
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import BuildViewer360Component from '../components/BuildViewer360Component';
import { getBuildById, resolveBuildRenderUrls } from '../services/buildService';
import { useCarContext } from '../services/carContext';

// Define loose types for the build object to satisfy TS
interface BuildAngle {
    index: number;
    url?: string;
    storagePath?: string;
}

interface BuildData {
    id: string;
    name?: string;
    vehicleName?: string;
    renderSet?: {
        angles: BuildAngle[];
    };
    wrap?: {
        brand: string;
        product_name?: string;
        productName?: string;
    };
    wheels?: {
        brand: string;
        product_name?: string;
        productName?: string;
    };
}

type BuildViewerRouteProp = RouteProp<{ params: { buildId: string } }, 'params'>;

export default function BuildViewerScreen() {
    const navigation = useNavigation();
    const route = useRoute<BuildViewerRouteProp>();
    const { buildId } = route.params || {};

    const [build, setBuild] = useState<BuildData | null>(null);
    const [loading, setLoading] = useState(true);
    const [renderUrls, setRenderUrls] = useState<string[]>([]);
    const { addDemoCar, demoMode, user } = useCarContext() as any;

    useEffect(() => {
        loadBuild();
    }, [buildId]);

    const loadBuild = async () => {
        if (!buildId) return;
        setLoading(true);
        try {
            // 1. Fetch
            const buildData: any = await getBuildById(buildId);
            if (!buildData) {
                // handle not found
                setLoading(false);
                return;
            }

            // 2. Resolve Renders
            const resolvedBuild: any = await resolveBuildRenderUrls(buildData);
            setBuild(resolvedBuild);

            // Extract URLs in order
            if (resolvedBuild.renderSet && resolvedBuild.renderSet.angles) {
                const urls = resolvedBuild.renderSet.angles
                    .sort((a: any, b: any) => {
                        if (typeof a.index === 'number' && typeof b.index === 'number') {
                            return a.index - b.index;
                        }
                        return 0; // Keep original order if index missing
                    })
                    .map((a: any) => a.url)
                    .filter((u: any) => !!u);
                setRenderUrls(urls);
            }

        } catch (error) {
            console.error('Error loading build:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToGarage = async () => {
        if (!build) return;

        // Clone build to a new car object
        const newCarData = {
            make: build.vehicleName?.split(' ')[0] || 'Custom', // Primitive parsing
            model: build.vehicleName?.split(' ').slice(1).join(' ') || 'Car',
            utils: {},
            // In a real app we'd need the actual vehicleId standard car map
            // For now, let's just confirm
        };

        Alert.alert(
            "Add to Garage",
            "Do you want to add this build to your garage?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Add",
                    onPress: () => {
                        // TODO: Implement actual cloning via carService
                        // For now, just navigate to home as if added
                        Alert.alert("Success", "Build added to your garage!");
                        (navigation as any).navigate('MainTabs', { screen: 'HomeTab' });
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color="#fff" size="large" />
            </View>
        );
    }

    if (!build) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Build not found</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.button}>
                    <Text style={styles.buttonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Custom Header */}
            <SafeAreaView style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleAddToGarage} style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ Add to Garage</Text>
                </TouchableOpacity>
            </SafeAreaView>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* 360 Viewer */}
                <View style={styles.viewerContainer}>
                    <BuildViewer360Component imageUrls={renderUrls} />
                </View>

                {/* Info Panel */}
                <View style={styles.infoContainer}>
                    <Text style={styles.title}>{build.name || 'Untitled Build'}</Text>
                    <Text style={styles.subtitle}>{build.vehicleName}</Text>

                    <View style={styles.divider} />

                    {/* Attribution Section */}
                    {build.wrap && (
                        <View style={styles.attrItem}>
                            <Text style={styles.attrLabel}>WRAP</Text>
                            <Text style={styles.attrValue}>
                                {build.wrap.brand} {build.wrap.product_name || build.wrap.productName}
                            </Text>
                        </View>
                    )}

                    {build.wheels && (
                        <View style={styles.attrItem}>
                            <Text style={styles.attrLabel}>WHEELS</Text>
                            <Text style={styles.attrValue}>
                                {build.wheels.brand} {build.wheels.product_name || build.wheels.productName}
                            </Text>
                        </View>
                    )}
                </View>

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 100,
        width: '100%',
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignSelf: 'flex-start',
        borderRadius: 20,
        margin: 10,
    },
    addButton: {
        padding: 12,
        backgroundColor: '#007AFF',
        borderRadius: 20,
        margin: 10,
        marginRight: 16,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    backText: {
        color: '#fff',
        fontWeight: '600',
    },
    scrollContent: {
        paddingTop: 80, // Space for header
        paddingBottom: 40,
    },
    viewerContainer: {
        width: '100%',
        marginBottom: 20,
    },
    infoContainer: {
        paddingHorizontal: 20,
    },
    title: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    subtitle: {
        color: '#888',
        fontSize: 16,
        marginBottom: 16,
    },
    divider: {
        height: 1,
        backgroundColor: '#333',
        marginBottom: 16,
    },
    attrItem: {
        marginBottom: 16,
    },
    attrLabel: {
        color: '#666',
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: 1,
    },
    attrValue: {
        color: '#ddd',
        fontSize: 16,
    },
    errorText: {
        color: '#ff4444',
        fontSize: 18,
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#333',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
    }
});
