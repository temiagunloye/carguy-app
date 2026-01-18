// src/screens/MyVehiclesScreen.tsx
// Vehicle list for Pro/Premium users

import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTier } from '../hooks/useTier';
import { getUserVehicles, type Vehicle } from '../services/vehicles';

interface Props {
    navigation: any;
}

export default function MyVehiclesScreen({ navigation }: Props) {
    const { tier, effectiveVehicleLimit } = useTier();
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        setLoading(true);
        const data = await getUserVehicles();
        setVehicles(data);
        setLoading(false);
    };

    const canCreateMore = vehicles.length < effectiveVehicleLimit;

    const renderVehicle = ({ item }: { item: Vehicle }) => (
        <TouchableOpacity
            style={styles.vehicleCard}
            onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.id })}
        >
            <View style={styles.vehicleIcon}>
                <Ionicons name="car-sport" size={32} color="#4a9eff" />
            </View>
            <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleName}>{item.displayName}</Text>
                {item.year && item.make && item.model && (
                    <Text style={styles.vehicleMeta}>
                        {item.year} {item.make} {item.model}
                    </Text>
                )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4a9eff" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>My Vehicles</Text>
                <Text style={styles.headerSubtitle}>
                    {vehicles.length} / {effectiveVehicleLimit} vehicles
                </Text>
            </View>

            {vehicles.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="car-sport-outline" size={64} color="#444" />
                    <Text style={styles.emptyText}>No vehicles yet</Text>
                    <Text style={styles.emptySubtext}>Create your first vehicle to get started</Text>
                </View>
            ) : (
                <FlatList
                    data={vehicles}
                    renderItem={renderVehicle}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                />
            )}

            {canCreateMore && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CreateVehicle')}
                    >
                        <Ionicons name="add-circle" size={20} color="#fff" />
                        <Text style={styles.createButtonText}>Create Vehicle</Text>
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        backgroundColor: '#000',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    headerSubtitle: {
        color: '#888',
        fontSize: 14,
    },
    listContent: {
        padding: 16,
    },
    vehicleCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    vehicleIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#0a2a4a',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    vehicleInfo: {
        flex: 1,
    },
    vehicleName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    vehicleMeta: {
        color: '#888',
        fontSize: 14,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    emptyText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtext: {
        color: '#888',
        fontSize: 14,
        textAlign: 'center',
    },
    footer: {
        padding: 20,
        backgroundColor: '#000',
    },
    createButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
