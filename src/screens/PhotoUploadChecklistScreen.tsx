// src/screens/PhotoUploadChecklistScreen.tsx
// 10-photo upload checklist for Pro/Premium vehicles

import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
    Alert,
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Props {
    navigation: any;
    route: {
        params: {
            vehicleId: string;
        };
    };
}

const REQUIRED_ANGLES = [
    { key: 'driver_front', label: 'Driver Front 45°' },
    { key: 'passenger_front', label: 'Passenger Front 45°' },
    { key: 'driver_rear', label: 'Driver Rear 45°' },
    { key: 'passenger_rear', label: 'Passenger Rear 45°' },
    { key: 'full_driver_side', label: 'Full Driver Side' },
    { key: 'full_passenger_side', label: 'Full Passenger Side' },
    { key: 'front_center', label: 'Front Center' },
    { key: 'rear_center', label: 'Rear Center' },
    { key: 'front_low', label: 'Front Low Angle' },
    { key: 'rear_low', label: 'Rear Low Angle' },
];

export default function PhotoUploadChecklistScreen({ navigation, route }: Props) {
    const { vehicleId } = route.params;
    const [photos, setPhotos] = useState<Record<string, string>>({});

    const handlePickPhoto = async (angleKey: string) => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow access to your photo library');
            return;
        }

        const result = await ImagePicker.launchImagePickerAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotos((prev) => ({
                ...prev,
                [angleKey]: result.assets[0].uri,
            }));
        }
    };

    const handleTakePhoto = async (angleKey: string) => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Required', 'Please allow camera access');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setPhotos((prev) => ({
                ...prev,
                [angleKey]: result.assets[0].uri,
            }));
        }
    };

    const completedCount = Object.keys(photos).length;
    const isComplete = completedCount === REQUIRED_ANGLES.length;

    const handleProceed = () => {
        if (!isComplete) {
            Alert.alert('Incomplete', `Please upload all 10 photos. ${completedCount}/10 completed.`);
            return;
        }

        // TODO: Upload photos to Firebase Storage
        // For now, just navigate to viewer
        Alert.alert('Success', 'Photos uploaded! (Demo mode - not actually uploading yet)', [
            {
                text: 'View Vehicle',
                onPress: () => navigation.navigate('VehicleDetail', { vehicleId }),
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Upload Photos</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    {completedCount} / {REQUIRED_ANGLES.length} Photos
                </Text>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${(completedCount / REQUIRED_ANGLES.length) * 100}%` },
                        ]}
                    />
                </View>
            </View>

            <ScrollView style={styles.listContainer}>
                {REQUIRED_ANGLES.map((angle) => {
                    const photoUri = photos[angle.key];
                    const isUploaded = !!photoUri;

                    return (
                        <View key={angle.key} style={styles.angleItem}>
                            <View style={styles.angleInfo}>
                                <View style={[styles.checkbox, isUploaded && styles.checkboxChecked]}>
                                    {isUploaded && <Ionicons name="checkmark" size={16} color="#fff" />}
                                </View>
                                <View style={styles.angleLabelContainer}>
                                    <Text style={styles.angleLabel}>{angle.label}</Text>
                                    {isUploaded && (
                                        <Image source={{ uri: photoUri }} style={styles.thumbnail} />
                                    )}
                                </View>
                            </View>

                            <View style={styles.angleActions}>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handleTakePhoto(angle.key)}
                                >
                                    <Ionicons name="camera" size={20} color="#4a9eff" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.actionButton}
                                    onPress={() => handlePickPhoto(angle.key)}
                                >
                                    <Ionicons name="images" size={20} color="#4a9eff" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.proceedButton, !isComplete && styles.proceedButtonDisabled]}
                    onPress={handleProceed}
                >
                    <Text style={styles.proceedButtonText}>
                        {isComplete ? 'Upload & Continue' : `Complete All Photos (${completedCount}/10)`}
                    </Text>
                </TouchableOpacity>
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
    progressContainer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#1a1a1a',
    },
    progressText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#2a2a2a',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4,
    },
    listContainer: {
        flex: 1,
    },
    angleItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
    },
    angleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkboxChecked: {
        backgroundColor: '#4CAF50',
        borderColor: '#4CAF50',
    },
    angleLabelContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    angleLabel: {
        color: '#fff',
        fontSize: 15,
        flex: 1,
    },
    thumbnail: {
        width: 50,
        height: 38,
        borderRadius: 4,
        backgroundColor: '#2a2a2a',
    },
    angleActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    footer: {
        padding: 20,
        backgroundColor: '#000',
    },
    proceedButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    proceedButtonDisabled: {
        backgroundColor: '#2a2a2a',
    },
    proceedButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
