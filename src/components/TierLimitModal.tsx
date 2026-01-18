// src/components/TierLimitModal.tsx
// Modal shown when user hits tier limits

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface Props {
    visible: boolean;
    onClose: () => void;
    onUpgrade: () => void;
    onBuySlot?: () => void;
    title: string;
    message: string;
    currentTier: 'free' | 'pro' | 'premium';
}

export default function TierLimitModal({
    visible,
    onClose,
    onUpgrade,
    onBuySlot,
    title,
    message,
    currentTier,
}: Props) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Ionicons name="lock-closed" size={48} color="#4a9eff" />

                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    <View style={styles.buttonContainer}>
                        {currentTier !== 'premium' && (
                            <TouchableOpacity
                                style={[styles.button, styles.upgradeButton]}
                                onPress={onUpgrade}
                            >
                                <Text style={styles.upgradeButtonText}>
                                    Upgrade to {currentTier === 'free' ? 'Pro' : 'Premium'}
                                </Text>
                            </TouchableOpacity>
                        )}

                        {onBuySlot && (
                            <TouchableOpacity
                                style={[styles.button, styles.slotButton]}
                                onPress={onBuySlot}
                            >
                                <Text style={styles.slotButtonText}>Buy Scan Slot</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: '#1a1a1a',
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
        textAlign: 'center',
    },
    message: {
        color: '#888',
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    buttonContainer: {
        width: '100%',
        gap: 12,
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
    },
    upgradeButton: {
        backgroundColor: '#4a9eff',
    },
    upgradeButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    slotButton: {
        backgroundColor: '#22c55e',
    },
    slotButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#2a2a2a',
    },
    cancelButtonText: {
        color: '#888',
        fontSize: 16,
        fontWeight: '600',
    },
});
