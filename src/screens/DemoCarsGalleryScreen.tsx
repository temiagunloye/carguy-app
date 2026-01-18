// src/screens/DemoCarsGalleryScreen.tsx
// Demo cars gallery for free tier

import React from 'react';
import {
    FlatList,
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { DEMO_CARS } from '../data/demoCars';

interface Props {
    navigation: any;
}

export default function DemoCarsGalleryScreen({ navigation }: Props) {
    const renderCar = ({ item }: any) => (
        <TouchableOpacity
            style={styles.carCard}
            onPress={() => navigation.navigate('DemoCarViewer', { carId: item.id })}
        >
            <Image source={{ uri: item.thumbnail }} style={styles.carThumbnail} />
            <View style={styles.carInfo}>
                <Text style={styles.carName}>{item.displayName}</Text>
                <Text style={styles.carMeta}>
                    {item.year} {item.make} {item.model}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Demo Cars</Text>
                <Text style={styles.headerSubtitle}>15 cars available</Text>
            </View>

            <FlatList
                data={DEMO_CARS}
                renderItem={renderCar}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 20,
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
        padding: 12,
    },
    carCard: {
        flex: 1,
        margin: 8,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        overflow: 'hidden',
    },
    carThumbnail: {
        width: '100%',
        height: 120,
        backgroundColor: '#2a2a2a',
    },
    carInfo: {
        padding: 12,
    },
    carName: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    carMeta: {
        color: '#888',
        fontSize: 12,
    },
});
