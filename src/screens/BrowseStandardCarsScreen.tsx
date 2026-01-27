// src/screens/BrowseStandardCarsScreen.tsx

import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { DocumentSnapshot } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import standardCarLibraryService, {
    StandardCar,
} from '../services/StandardCarLibraryService';

/**
 * Browse Standard Dealer Cars Screen
 * Gallery view with search and filtering
 */
const BrowseStandardCarsScreen: React.FC = () => {
    const navigation = useNavigation();

    const [cars, setCars] = useState<StandardCar[]>([]);
    const [loading, setLoading] = useState(false); // Start as FALSE - load in background
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
    const [hasMore, setHasMore] = useState(true);

    /**
     * Load initial cars
     */
    const loadCars = useCallback(async (reset = false) => {
        try {
            if (reset) {
                setLoading(true);
                setCars([]);
                setLastDoc(null);
                setHasMore(true);
            }

            const { cars: newCars, lastDoc: newLastDoc } =
                await standardCarLibraryService.listApprovedStandardCars(20, reset ? undefined : lastDoc || undefined);

            if (reset) {
                setCars(newCars);
            } else {
                setCars((prev) => [...prev, ...newCars]);
            }

            setLastDoc(newLastDoc);
            setHasMore(newCars.length === 20); // If we got full page, might be more
        } catch (error) {
            console.error('Failed to load standard cars:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [lastDoc]);

    /**
     * Search cars
     */
    const handleSearch = useCallback(async (query: string) => {
        if (!query.trim()) {
            loadCars(true);
            return;
        }

        setLoading(true);
        try {
            const results = await standardCarLibraryService.searchStandardCars(query);
            setCars(results);
            setHasMore(false); // Search results don't paginate
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    }, [loadCars]);

    /**
     * Initial load
     */
    useEffect(() => {
        loadCars(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /**
     * Handle search input change with debounce
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, handleSearch]);

    /**
     * Refresh handler
     */
    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setSearchQuery('');
        loadCars(true);
    }, [loadCars]);

    /**
     * Load more (pagination)
     */
    const handleLoadMore = useCallback(() => {
        if (!loading && hasMore && !searchQuery) {
            loadCars(false);
        }
    }, [loading, hasMore, searchQuery, loadCars]);

    /**
     * Navigate to car detail
     */
    const handleCarPress = useCallback(
        (car: StandardCar) => {
            (navigation as any).navigate('StandardCarDetail', { carId: car.id });
        },
        [navigation]
    );

    /**
     * Render car card
     */
    const renderCarCard = useCallback(
        ({ item }: { item: StandardCar }) => (
            <TouchableOpacity
                style={styles.carCard}
                onPress={() => handleCarPress(item)}
                activeOpacity={0.7}
            >
                {/* Direct image - uses pre-resolved displayUrl, no async, no flash */}
                <View style={styles.thumbnail}>
                    <Image
                        source={{ uri: item.displayUrl || `https://via.placeholder.com/400x300.png?text=${item.make}+${item.model}` }}
                        style={styles.thumbnailImage}
                        contentFit="cover"
                        transition={200} // Smooth fade in
                    />
                </View>
                <View style={styles.carInfo}>
                    <Text style={styles.carName}>{item.displayName}</Text>
                    <Text style={styles.carDetails}>
                        {item.year} • {item.make} {item.model}
                    </Text>
                    {item.dealerName && (
                        <Text style={styles.dealerName}>From {item.dealerName}</Text>
                    )}
                </View>
            </TouchableOpacity>
        ),
        [handleCarPress]
    );

    /**
     * Empty state
     */
    const renderEmptyState = useCallback(() => {
        if (loading) return null;

        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>
                    {searchQuery ? 'No cars found' : 'No cars available'}
                </Text>
                <Text style={styles.emptySubtitle}>
                    {searchQuery
                        ? 'Try a different search term'
                        : 'Check back later for new additions'}
                </Text>
            </View>
        );
    }, [loading, searchQuery]);

    /**
     * Footer loader
     */
    const renderFooter = useCallback(() => {
        if (!loading || cars.length === 0) return null;

        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color="#007AFF" />
            </View>
        );
    }, [loading, cars.length]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.7}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Car Library</Text>
                <Text style={styles.headerSubtitle}>
                    Browse our 360° car collection
                </Text>
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by make, model, year..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
            </View>

            {/* Car Grid */}
            <FlatList
                data={cars}
                renderItem={renderCarCard}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={renderEmptyState}
                ListFooterComponent={renderFooter}
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        paddingVertical: 8,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 14,
        color: '#888',
    },
    searchContainer: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    searchInput: {
        height: 44,
        backgroundColor: '#1a1a1a',
        borderRadius: 10,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#fff',
        borderWidth: 1,
        borderColor: '#333',
    },
    listContent: {
        paddingHorizontal: 12,
        paddingBottom: 20,
    },
    carCard: {
        flex: 1,
        margin: 8,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    thumbnail: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
    },
    thumbnailPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
        fontSize: 12,
    },
    carInfo: {
        padding: 12,
    },
    carName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 4,
    },
    carDetails: {
        fontSize: 12,
        color: '#888',
        marginBottom: 4,
    },
    dealerName: {
        fontSize: 11,
        color: '#007AFF',
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 14,
        color: '#888',
    },
    footerLoader: {
        paddingVertical: 20,
        alignItems: 'center',
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
});

export default BrowseStandardCarsScreen;
