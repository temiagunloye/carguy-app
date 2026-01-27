
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Viewer360Component from '../components/Viewer360Component';
import { useCarContext } from '../services/carContext';
import { StandardCar, standardCarLibraryService } from '../services/StandardCarLibraryService';

/**
 * Demo Sandbox Screen
 * Allows users to try on parts without saving to their garage
 */
const DemoSandboxScreen: React.FC = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { carId, variantId } = route.params as any;
    const { demoMode, addDemoCar } = useCarContext() as any;

    const [car, setCar] = useState<StandardCar | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentAngle, setCurrentAngle] = useState('front_quarter');

    useEffect(() => {
        const loadCar = async () => {
            // In a real implementation, we would fetch the specific car config
            // For now, we just load the standard car to show the viewer
            try {
                const carData = await standardCarLibraryService.getStandardCarById(carId);
                if (carData) {
                    if (carData.heroAssetPath) {
                        carData.displayUrl = await standardCarLibraryService.resolveStoragePath(carData.heroAssetPath);
                    }
                    setCar(carData);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        loadCar();
    }, [carId]);

    if (loading) {
        return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
    }

    if (!car) {
        return <View style={styles.center}><Text style={styles.error}>Car not found</Text></View>;
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>Close Demo</Text>
                </TouchableOpacity>
                <Text style={styles.title}>Sandbox Mode</Text>
                <View style={{ width: 60 }} />
            </SafeAreaView>

            <View style={styles.viewerContainer}>
                <Viewer360Component
                    variantId={variantId}
                    angleNames={car.angleNames || []}
                    initialAngle={car.angleNames?.[0] || 'front'}
                    onAngleChange={setCurrentAngle}
                    enablePreload
                />
            </View>

            <View style={styles.controls}>
                <Text style={styles.instructions}>
                    Try on parts and visualize upgrades in real-time.
                    (Sandbox features coming soon)
                </Text>

                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => {
                        Alert.alert("Coming Soon", "Full part sandbox is under construction.");
                    }}
                >
                    <Text style={styles.ctaText}>Open Part Selector</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    backBtn: {
        padding: 10,
    },
    backText: {
        color: '#007AFF',
        fontSize: 16,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    error: {
        color: 'red',
    },
    viewerContainer: {
        height: 350,
        marginTop: 20,
    },
    controls: {
        padding: 20,
        alignItems: 'center',
    },
    instructions: {
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
    ctaButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 30,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    ctaText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
    }
});

export default DemoSandboxScreen;
