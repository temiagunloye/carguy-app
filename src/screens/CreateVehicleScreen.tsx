// src/screens/CreateVehicleScreen.tsx
// Vehicle creation for Pro/Premium users

import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTier } from '../hooks/useTier';
import { createVehicle } from '../services/vehicles';

interface Props {
    navigation: any;
}

export default function CreateVehicleScreen({ navigation }: Props) {
    const { tier, effectiveVehicleLimit } = useTier();
    const [displayName, setDisplayName] = useState('');
    const [year, setYear] = useState('');
    const [make, setMake] = useState('');
    const [model, setModel] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!displayName.trim()) {
            Alert.alert('Required', 'Please enter a vehicle name');
            return;
        }

        setLoading(true);
        try {
            const vehicleId = await createVehicle({
                displayName: displayName.trim(),
                year: year ? parseInt(year) : undefined,
                make: make.trim() || undefined,
                model: model.trim() || undefined,
            });

            Alert.alert('Success', 'Vehicle created! Now upload 10 photos.', [
                {
                    text: 'Upload Photos',
                    onPress: () => navigation.replace('PhotoUploadChecklist', { vehicleId }),
                },
            ]);
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Add Vehicle</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.content}>
                <Text style={styles.infoText}>
                    You can create up to {effectiveVehicleLimit} vehicle{effectiveVehicleLimit !== 1 ? 's' : ''} on {tier.toUpperCase()} tier.
                </Text>

                <View style={styles.form}>
                    <Text style={styles.label}>Vehicle Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., My 2024 Porsche 911"
                        placeholderTextColor="#666"
                        value={displayName}
                        onChangeText={setDisplayName}
                    />

                    <Text style={styles.label}>Year (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="2024"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                        value={year}
                        onChangeText={setYear}
                        maxLength={4}
                    />

                    <Text style={styles.label}>Make (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Porsche"
                        placeholderTextColor="#666"
                        value={make}
                        onChangeText={setMake}
                    />

                    <Text style={styles.label}>Model (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="911"
                        placeholderTextColor="#666"
                        value={model}
                        onChangeText={setModel}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.createButton, loading && styles.createButtonDisabled]}
                    onPress={handleCreate}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="add-circle-outline" size={20} color="#fff" />
                            <Text style={styles.createButtonText}>Create Vehicle</Text>
                        </>
                    )}
                </TouchableOpacity>

                <Text style={styles.noteText}>
                    After creating, you'll need to upload 10 photos of your vehicle from specific angles.
                </Text>
            </View>
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
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    infoText: {
        color: '#888',
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
    },
    form: {
        marginBottom: 32,
    },
    label: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        padding: 16,
        color: '#fff',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#2a2a2a',
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
    createButtonDisabled: {
        opacity: 0.5,
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    noteText: {
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        marginTop: 16,
        lineHeight: 18,
    },
});
