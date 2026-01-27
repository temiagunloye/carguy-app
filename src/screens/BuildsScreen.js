
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image'; // Use Expo Image
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { getHeroBuilds } from '../services/buildService';
import { useCarContext } from '../services/carContext';
import standardCarLibraryService from '../services/StandardCarLibraryService';

export default function BuildsScreen() {
    const navigation = useNavigation();
    const { demoMode } = useCarContext();
    const [builds, setBuilds] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadBuilds();
    }, [demoMode]);

    const loadBuilds = async () => {
        setLoading(true);
        if (demoMode) {
            setBuilds([]);
            setLoading(false);
            return;
        }

        try {
            const heroBuilds = await getHeroBuilds();

            // Resolve thumbnails (first angle or preview)
            // We need at least one image to show properly
            const buildsWithImages = await Promise.all(heroBuilds.map(async (build) => {
                // Quick resolution for thumbnail only, or reuse resolveBuildRenderUrls?
                // resolveBuildRenderUrls might resolve ALL angles which is heavy for a list.
                // Let's resolve just the first one or "main" if possible.
                // Actually build.renderSet.angles[0] usually.

                let thumbUrl = null;
                if (build.renderSet?.angles?.length > 0) {
                    // Try to get a front_low or driver_front preference
                    // Or just index 0
                    const target = build.renderSet.angles.find(a => a.index === 0) || build.renderSet.angles[0];
                    if (target.url) {
                        thumbUrl = target.url;
                    } else if (target.storagePath) {
                        try {
                            thumbUrl = await standardCarLibraryService.resolveStoragePath(target.storagePath);
                        } catch (e) {
                            console.warn('Failed resolve thumb', e);
                        }
                    }
                }

                return { ...build, thumbUrl };
            }));

            setBuilds(buildsWithImages);
        } catch (error) {
            console.error('Failed to load builds', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePress = (build) => {
        navigation.navigate('BuildViewer', { buildId: build.id });
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handlePress(item)}
            activeOpacity={0.8}
        >
            <View style={styles.imageContainer}>
                {item.thumbUrl ? (
                    <Image
                        source={{ uri: item.thumbUrl }}
                        style={styles.cardImage}
                        contentFit="cover"
                        transition={200}
                    />
                ) : (
                    <View style={styles.placeholder}>
                        <Text style={styles.placeholderText}>No Preview</Text>
                    </View>
                )}
                {item.isHero && (
                    <View style={styles.heroBadge}>
                        <Text style={styles.heroText}>FEATURED</Text>
                    </View>
                )}
            </View>
            <View style={styles.cardInfo}>
                <Text style={styles.buildName}>{item.name || 'Untitled Build'}</Text>
                <Text style={styles.vehicleName}>{item.vehicleName || 'Unknown Vehicle'}</Text>

                {/* Attribution Preview */}
                <View style={styles.attrRow}>
                    {item.wrap && (
                        <Text style={styles.attrText} numberOfLines={1}>
                            Wrap: {item.wrap.brand} {item.wrap.product_name || item.wrap.productName}
                        </Text>
                    )}
                    {item.wheels && (
                        <Text style={styles.attrText} numberOfLines={1}>
                            Wheels: {item.wheels.brand} {item.wheels.product_name || item.wheels.productName}
                        </Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Featured Builds</Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator color="#fff" size="large" />
                </View>
            ) : (
                <FlatList
                    data={builds}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyTitle}>
                                {demoMode ? 'Preview Mode' : 'No Builds Found'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {demoMode
                                    ? 'Featured builds are not available in demo mode.'
                                    : 'Check back later for new community builds.'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    backButton: {
        paddingRight: 16,
    },
    backText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    listContent: {
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        marginBottom: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#333',
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#111',
    },
    cardImage: {
        width: '100%',
        height: '100%',
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: '#666',
    },
    heroBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#ff3b30',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    heroText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: 'bold',
    },
    cardInfo: {
        padding: 12,
    },
    buildName: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    vehicleName: {
        color: '#888',
        fontSize: 14,
        marginBottom: 8,
    },
    attrRow: {
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 8,
    },
    attrText: {
        color: '#aaa',
        fontSize: 12,
        marginBottom: 2,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#666',
        textAlign: 'center',
    }
});
