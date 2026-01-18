// src/screens/DemoCarViewerScreen.tsx
// Demo car viewer with parts customization

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { CarViewer360 } from '../components/CarViewer360';
import { getDemoCarById } from '../data/demoCars';
import { PARTS_CATALOG } from '../data/partsCatalog';
import { useBuildState } from '../hooks/useBuildState';
import { useTier } from '../hooks/useTier';
import { saveBuild } from '../services/builds';

interface Props {
    navigation: any;
    route: {
        params: {
            carId: string;
        };
    };
}

export default function DemoCarViewerScreen({ navigation, route }: Props) {
    const { carId } = route.params;
    const car = getDemoCarById(carId);
    const { activeParts, togglePart } = useBuildState();
    const { tier, limits } = useTier();

    const handleSave = async () => {
        if (activeParts.length === 0) {
            Alert.alert('No Parts', 'Add at least one part before saving');
            return;
        }

        Alert.prompt(
            'Save Build',
            'Enter a name for this build',
            async (name) => {
                if (!name) return;
                try {
                    await saveBuild(carId, activeParts, name, tier);
                    Alert.alert('Saved!', `Build "${name}" saved successfully`);
                } catch (error: any) {
                    Alert.alert('Save Failed', error.message);
                }
            }
        );
    };

    if (!car) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Car not found</Text>
            </View>
        );
    }

    const isPartActive = (partId: string) => activeParts.some((p) => p.id === partId);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{car.displayName}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Viewer */}
            <CarViewer360 angles={car.angles} activeParts={activeParts} />

            {/* Parts counter */}
            <View style={styles.counterContainer}>
                <Text style={styles.counterText}>
                    Saveable Parts: {activeParts.length} / {limits.maxActiveParts}
                </Text>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Ionicons name="save-outline" size={18} color="#fff" />
                        <Text style={styles.saveButtonText}>Save</Text>
                    </TouchableOpacity>
                    <Text style={styles.tierBadge}>{tier.toUpperCase()}</Text>
                </View>
            </View>

            {/* Parts catalog */}
            <ScrollView style={styles.partsContainer} horizontal showsHorizontalScrollIndicator={false}>
                {PARTS_CATALOG.map((part) => {
                    const active = isPartActive(part.id);
                    return (
                        <TouchableOpacity
                            key={part.id}
                            style={[styles.partCard, active && styles.partCardActive]}
                            onPress={() => togglePart(part)}
                        >
                            <View style={styles.partThumbnail}>
                                <Text style={styles.partIcon}>🔧</Text>
                            </View>
                            <Text style={styles.partName}>{part.displayName}</Text>
                            <Text style={styles.partCategory}>{part.category}</Text>
                            {active && (
                                <View style={styles.activeIndicator}>
                                    <Ionicons name="checkmark-circle" size={20} color="#4a9eff" />
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
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
        paddingVertical: 16,
        backgroundColor: '#000',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0a0a0a',
    },
    errorText: {
        color: '#fff',
        fontSize: 16,
    },
    counterContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#1a1a1a',
    },
    counterText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#2a4a6a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    tierBadge: {
        color: '#4a9eff',
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#1a3a5a',
        borderRadius: 4,
    },
    partsContainer: {
        backgroundColor: '#0a0a0a',
        paddingVertical: 16,
    },
    partCard: {
        width: 100,
        marginHorizontal: 8,
        padding: 12,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    partCardActive: {
        borderColor: '#4a9eff',
        backgroundColor: '#1a2a3a',
    },
    partThumbnail: {
        width: '100%',
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2a2a2a',
        borderRadius: 8,
        marginBottom: 8,
    },
    partIcon: {
        fontSize: 32,
    },
    partName: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    partCategory: {
        color: '#888',
        fontSize: 10,
        textTransform: 'capitalize',
    },
    activeIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
});
