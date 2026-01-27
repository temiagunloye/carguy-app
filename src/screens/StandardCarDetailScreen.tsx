// src/screens/StandardCarDetailScreen.tsx

import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Viewer360Component from '../components/Viewer360Component';
import { createBuild, setActiveBuild } from '../services/buildService';
import { useCarContext } from '../services/carContext';
import { getAllCarsForUser, saveCarForUser, setActiveCar } from '../services/carService';
import { canAddCar, getPlanLimitMessage } from '../services/plans';
import standardCarLibraryService, {
    StandardCar,
    StandardCarVariant,
} from '../services/StandardCarLibraryService';
import { variantFadeController } from '../services/VariantFadeController';

interface RouteParams {
    carId: string;
}

/**
 * Standard Car Detail Screen
 * Shows 360 viewer, paint selector, specs, and CTA for try-on
 */
const StandardCarDetailScreen: React.FC = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { carId } = route.params as RouteParams;

    const [car, setCar] = useState<StandardCar | null>(null);
    const [variants, setVariants] = useState<StandardCarVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<StandardCarVariant | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentAngle, setCurrentAngle] = useState<string>('');
    const [showEnrichedSpecs, setShowEnrichedSpecs] = useState(false);
    const [addingToGarage, setAddingToGarage] = useState(false);
    const [isNavigatingToAddPart, setIsNavigatingToAddPart] = useState(false);

    const context = useCarContext() as any;
    const user = context?.user;
    const refreshActiveCar = context?.refreshActiveCar;
    const setActiveCarState = context?.setActiveCarState;
    const demoMode = context?.demoMode;
    const addDemoCar = context?.addDemoCar;
    const plan = context?.plan || 'free';

    /**
     * Handle "Add to Garage"
     */
    const handleAddToGarage = useCallback(async () => {
        if (!car || !selectedVariant) return;

        // Check limits if not in demo mode
        if (!demoMode && user) {
            try {
                const existingCars = await getAllCarsForUser(user.uid);
                if (!canAddCar(plan, existingCars.length)) {
                    Alert.alert(
                        'Limit Reached',
                        getPlanLimitMessage(plan, 'car'),
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Upgrade', onPress: () => (navigation as any).navigate('Upgrade') },
                        ]
                    );
                    return;
                }
            } catch (e) {
                console.warn('Failed to check vehicle limits:', e);
            }
        }

        setAddingToGarage(true);
        try {
            // Prepare car data for user inventory
            const userCarData = {
                nickname: car.displayName,
                year: car.year.toString(),
                make: car.make,
                model: car.model,
                trim: car.trim || '',
                paintColor: selectedVariant.colorName,
                dealerImageUrl: car.heroAssetPath || null,
                imageUrl: car.heroAssetPath || null,
                standardCarId: car.id,
                activeVariantId: selectedVariant.id,
            };

            // Save to Firebase (or demo mode)
            let newCarId: string | null = null;
            if (demoMode) {
                const newCar = addDemoCar(userCarData);
                newCarId = newCar.id;
            } else if (user) {
                const savedId = await saveCarForUser({
                    uid: user.uid,
                    data: userCarData,
                });
                newCarId = savedId;
            }

            if (!newCarId) {
                throw new Error("Failed to obtain car ID");
            }

            if (!demoMode && user) {
                // Create default build
                const buildId = await createBuild(user.uid, newCarId, "Primary Build");
                await setActiveBuild(user.uid, buildId);
                await setActiveCar(user.uid, newCarId);

                // Refresh global context
                await refreshActiveCar();
            }

            Alert.alert(
                'Success',
                'Car added to your garage!',
                [
                    {
                        text: 'Go to Shop',
                        onPress: () => (navigation as any).navigate('MainTabs', { screen: 'ShopTab' }),
                    },
                    {
                        text: 'Keep Browsing',
                        style: 'cancel',
                    },
                ]
            );
        } catch (error: any) {
            console.error('Failed to add car:', error);
            Alert.alert('Error', error.message || 'Failed to add car to garage');
        } finally {
            setAddingToGarage(false);
        }
    }, [car, selectedVariant, navigation, user, demoMode, addDemoCar, refreshActiveCar]);

    /**
     * Load car data
     */
    useEffect(() => {
        const loadCarData = async () => {
            setLoading(true);
            try {
                const [carData, variantsData] = await Promise.all([
                    standardCarLibraryService.getStandardCarById(carId),
                    standardCarLibraryService.getVariantsForCar(carId),
                ]);

                if (!carData) {
                    Alert.alert('Error', 'Car not found');
                    navigation.goBack();
                    return;
                }

                setCar(carData);
                setVariants(variantsData);

                // Set default variant
                const defaultVariant =
                    variantsData.find((v) => v.id === carData.defaultVariantId) ||
                    variantsData[0];

                if (defaultVariant) {
                    setSelectedVariant(defaultVariant);
                }

                // Set initial angle
                setCurrentAngle(carData.angleNames[0] || '');
            } catch (error) {
                console.error('Failed to load car data:', error);
                Alert.alert('Error', 'Failed to load car data');
            } finally {
                setLoading(false);
            }
        };

        loadCarData();
    }, [carId, navigation]);

    /**
     * Handle variant (paint color) change
     */
    const handleVariantChange = useCallback(
        async (variant: StandardCarVariant) => {
            if (!selectedVariant || variant.id === selectedVariant.id) return;

            setSelectedVariant(variant);

            // Transition with fade (preload target angle)
            await variantFadeController.transitionToVariant(
                selectedVariant.id,
                variant.id,
                currentAngle
            );
        },
        [selectedVariant, currentAngle]
    );

    /**
     * Navigate to sandbox try-on
     */
    const handleTryParts = useCallback(() => {
        if (!car || !selectedVariant) return;

        (navigation as any).navigate('DemoSandbox', {
            carId: car.id,
            variantId: selectedVariant.id,
        });
    }, [car, selectedVariant, navigation]);

    /**
     * Handle "Add Part to Build"
     * Ensures car is in garage/context first
     */
    const handleAddPartToBuild = useCallback(async () => {
        if (!car || !selectedVariant) return;

        // Check limits if not in demo mode
        if (!demoMode && user) {
            try {
                const existingCars = await getAllCarsForUser(user.uid);
                if (!canAddCar(plan, existingCars.length)) {
                    Alert.alert(
                        'Limit Reached',
                        getPlanLimitMessage(plan, 'car'),
                        [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Upgrade', onPress: () => (navigation as any).navigate('Upgrade') },
                        ]
                    );
                    return;
                }
            } catch (e) {
                console.warn('Failed to check inventory limits:', e);
            }
        }

        setIsNavigatingToAddPart(true);

        try {
            let targetCarId = car.id;
            let targetBuildId = null;

            // Prepare car data for user inventory
            const userCarData = {
                nickname: car.displayName,
                year: car.year.toString(),
                make: car.make,
                model: car.model,
                trim: car.trim || '',
                paintColor: selectedVariant.colorName,
                dealerImageUrl: car.heroAssetPath || null,
                imageUrl: car.heroAssetPath || null, // Best fallback
                standardCarId: car.id,
                activeVariantId: selectedVariant.id,
            };

            if (demoMode) {
                // Save locally for demo
                const newCar = addDemoCar(userCarData);
                targetCarId = newCar.id;

                const defaultBuild = {
                    id: `build_${Date.now()}`,
                    vehicleId: targetCarId,
                    name: "Primary Build",
                    isActive: true,
                    parts: [],
                    folders: [],
                };

                const updatedCar = { ...newCar, builds: [defaultBuild], activeBuildId: defaultBuild.id };
                setActiveCarState(updatedCar);
                targetBuildId = defaultBuild.id;
            } else if (user) {
                // Save to Firebase
                const carIdInInventory = await saveCarForUser({
                    uid: user.uid,
                    data: userCarData,
                });

                if (!carIdInInventory) {
                    throw new Error("Failed to save car to inventory");
                }

                targetCarId = carIdInInventory;

                // Create build and set active
                targetBuildId = await createBuild(user.uid, carIdInInventory, "Primary Build");
                await setActiveBuild(user.uid, targetBuildId);
                await setActiveCar(user.uid, carIdInInventory);

                // Refresh global context
                await refreshActiveCar();
            }

            // Navigate to Add Part
            if (targetBuildId) {
                (navigation as any).navigate('AddPart', {
                    fromShop: true,
                    buildId: targetBuildId
                });
            } else {
                throw new Error("Target build ID not generated");
            }

        } catch (error) {
            console.error('Failed to prepare add part flow:', error);
            Alert.alert('Error', 'Failed to prepare car for adding parts');
        } finally {
            setIsNavigatingToAddPart(false);
        }
    }, [car, selectedVariant, user, demoMode, addDemoCar, setActiveCarState, refreshActiveCar, navigation]);

    /**
     * Loading state
     */
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading car details...</Text>
            </View>
        );
    }

    if (!car || !selectedVariant) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Car not found</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
            >
                <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>

            {/* 360 Viewer */}
            <View style={styles.viewerContainer}>
                <Viewer360Component
                    variantId={selectedVariant.id}
                    angleNames={car.angleNames}
                    initialAngle={currentAngle}
                    onAngleChange={(angleName, _) => setCurrentAngle(angleName)}
                    enablePreload
                    preloadRadius={2}
                />
            </View>

            {/* Car Info */}
            <View style={styles.infoSection}>
                <Text style={styles.carTitle}>{car.displayName}</Text>
                <Text style={styles.carSubtitle}>
                    {car.year} {car.make} {car.model} {car.trim}
                </Text>
                {car.dealerName && (
                    <Text style={styles.dealerInfo}>From {car.dealerName}</Text>
                )}
            </View>

            <View style={styles.actionButtonsContainer}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleAddToGarage}
                    activeOpacity={0.8}
                    disabled={addingToGarage}
                >
                    {addingToGarage ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.primaryButtonText}>Add to My Garage</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleAddPartToBuild}
                    activeOpacity={0.8}
                    disabled={isNavigatingToAddPart}
                >
                    {isNavigatingToAddPart ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.secondaryButtonText}>Add Part to Build +</Text>
                    )}
                </TouchableOpacity>
                <Text style={styles.actionHelperText}>
                    Save this car and start customizing with parts
                </Text>
            </View>

            {/* Paint Color Selector */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Paint Color</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.colorScroll}
                >
                    {variants.map((variant) => (
                        <TouchableOpacity
                            key={variant.id}
                            style={[
                                styles.colorChip,
                                variant.id === selectedVariant.id && styles.colorChipSelected,
                            ]}
                            onPress={() => handleVariantChange(variant)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.colorChipInner}>
                                <Text style={styles.colorChipText}>{variant.colorName}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Enriched Specs (if available) */}
            {
                car.enrichedSpecs && (
                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.specsHeader}
                            onPress={() => setShowEnrichedSpecs(!showEnrichedSpecs)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.sectionTitle}>Vehicle Specifications</Text>
                            <Text style={styles.toggleIcon}>
                                {showEnrichedSpecs ? '▼' : '▶'}
                            </Text>
                        </TouchableOpacity>

                        {showEnrichedSpecs && (
                            <View style={styles.specsContent}>
                                <SpecRow label="Trim" value={car.enrichedSpecs.trim} />
                                <SpecRow label="Engine" value={car.enrichedSpecs.engine} />
                                <SpecRow label="Drivetrain" value={car.enrichedSpecs.drivetrain} />
                                <SpecRow label="MPG" value={car.enrichedSpecs.mpg} />
                                <SpecRow label="Exterior Color" value={car.enrichedSpecs.exteriorColor} />
                                <SpecRow label="Interior Color" value={car.enrichedSpecs.interiorColor} />

                                {car.enrichedSpecs.features.length > 0 && (
                                    <>
                                        <Text style={styles.featuresTitle}>Features</Text>
                                        {car.enrichedSpecs.features.map((feature, idx) => (
                                            <Text key={idx} style={styles.featureItem}>
                                                • {feature}
                                            </Text>
                                        ))}
                                    </>
                                )}

                                <Text style={styles.specsSource}>
                                    Source: {car.enrichedSpecs.provenance}
                                </Text>
                            </View>
                        )}
                    </View>
                )
            }

            <TouchableOpacity
                style={styles.ctaButton}
                onPress={handleTryParts}
                activeOpacity={0.8}
            >
                <Text style={styles.ctaButtonText}>Try Sandbox Preview</Text>
                <Text style={styles.ctaButtonSubtext}>
                    Instant preview • No car registration required
                </Text>
            </TouchableOpacity>

            <View style={styles.upgradeHint}>
                <Text style={styles.upgradeHintText}>
                    Want to upload your own car with 360° photos?
                </Text>
                <TouchableOpacity
                    style={styles.upgradeButton}
                    onPress={() => (navigation as any).navigate('Upgrade')}
                >
                    <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

/**
 * Spec Row Component
 */
const SpecRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
    if (!value) return null;

    return (
        <View style={styles.specRow}>
            <Text style={styles.specLabel}>{label}:</Text>
            <Text style={styles.specValue}>{value}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    content: {
        paddingBottom: 40,
    },
    backButton: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 12,
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    loadingText: {
        marginTop: 12,
        color: '#888',
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    },
    errorText: {
        color: '#ff4444',
        fontSize: 16,
    },
    viewerContainer: {
        width: '100%',
        height: 300,
        backgroundColor: '#000',
        marginBottom: 20,
    },
    infoSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    carTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    carSubtitle: {
        fontSize: 16,
        color: '#888',
        marginBottom: 8,
    },
    dealerInfo: {
        fontSize: 14,
        color: '#007AFF',
    },
    section: {
        paddingHorizontal: 20,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 12,
    },
    colorScroll: {
        paddingRight: 20,
    },
    colorChip: {
        marginRight: 12,
        borderRadius: 10,
        backgroundColor: '#1a1a1a',
        borderWidth: 2,
        borderColor: '#333',
    },
    colorChipSelected: {
        borderColor: '#007AFF',
    },
    colorChipInner: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    colorChipText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    specsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    toggleIcon: {
        color: '#007AFF',
        fontSize: 14,
    },
    specsContent: {
        marginTop: 16,
    },
    specRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    specLabel: {
        color: '#888',
        fontSize: 14,
        width: 120,
    },
    specValue: {
        flex: 1,
        color: '#fff',
        fontSize: 14,
    },
    featuresTitle: {
        color: '#888',
        fontSize: 14,
        marginTop: 12,
        marginBottom: 8,
    },
    featureItem: {
        color: '#fff',
        fontSize: 14,
        marginLeft: 8,
        marginBottom: 4,
    },
    specsSource: {
        color: '#666',
        fontSize: 11,
        marginTop: 12,
        fontStyle: 'italic',
    },
    ctaButton: {
        marginHorizontal: 20,
        marginTop: 24,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        alignItems: 'center',
    },
    ctaButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    ctaButtonSubtext: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        marginTop: 4,
    },
    upgradeHint: {
        marginHorizontal: 20,
        marginTop: 24,
        padding: 16,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
        alignItems: 'center',
    },
    upgradeHintText: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 12,
    },
    upgradeButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#007AFF',
        borderRadius: 8,
    },
    upgradeButtonText: {
        color: '#007AFF',
        fontSize: 14,
        fontWeight: '600',
    },
    actionButtonsContainer: {
        padding: 20,
        backgroundColor: '#000',
    },
    primaryButton: {
        backgroundColor: '#22c55e',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    secondaryButtonText: {
        color: '#007AFF',
        fontSize: 18,
        fontWeight: '700',
    },
    actionHelperText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 8,
    },
});

export default StandardCarDetailScreen;
