// src/screens/RenderProcessingScreen.tsx
// Real-time status screen for 3D reconstruction jobs

import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { db } from '../services/firebaseConfig';
import type { RenderJob } from '../types/renderJob';

interface Props {
    navigation: any;
    route: {
        params: {
            jobId: string;
            carId: string;
        };
    };
}

export default function RenderProcessingScreen({ navigation, route }: Props) {
    const { jobId, carId } = route.params;
    const [job, setJob] = useState<RenderJob | null>(null);
    const [loading, setLoading] = useState(true);

    // Subscribe to render job
    useEffect(() => {
        if (!jobId) return;

        console.log(`[RenderProcessing] Subscribing to job: ${jobId}`);

        const unsubscribe = onSnapshot(
            doc(db, 'renderJobs', jobId),
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.data() as RenderJob;
                    setJob(data);
                    setLoading(false);

                    console.log(`[RenderProcessing] Job status: ${data.status}`);

                    // Navigate to viewer when complete
                    if (data.status === 'complete' && data.result.modelUrl) {
                        console.log(`[RenderProcessing] Job complete, navigating to viewer`);
                        console.log(`[RenderProcessing] Model URL: ${data.result.modelUrl}`);
                        navigation.replace('CarModelViewer', {
                            carId,
                            modelUrl: data.result.modelUrl,
                            carName: `Car ${carId}`,
                        });
                    }
                } else {
                    setLoading(false);
                    console.error(`[RenderProcessing] Job ${jobId} not found`);
                }
            },
            (error) => {
                console.error('[RenderProcessing] Firestore error:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [jobId, carId, navigation]);

    // Render different UI based on status
    const renderContent = () => {
        if (loading || !job) {
            return (
                <>
                    <ActivityIndicator size="large" color="#4a9eff" />
                    <Text style={styles.statusText}>Loading...</Text>
                </>
            );
        }

        if (job.status === 'queued') {
            return (
                <>
                    <ActivityIndicator size="large" color="#f59e0b" />
                    <Text style={styles.statusText}>Queued</Text>
                    <Text style={styles.subtext}>
                        Your 3D model is in the queue
                    </Text>
                </>
            );
        }

        if (job.status === 'processing') {
            return (
                <>
                    <ActivityIndicator size="large" color="#4a9eff" />
                    <Text style={styles.statusText}>Generating 3D Model...</Text>
                    <Text style={styles.subtext}>
                        This may take 10-30 minutes{'\n'}
                        We prioritize accuracy over speed
                    </Text>
                    <Text style={styles.hint}>
                        You can close this screen - we'll notify you when complete
                    </Text>
                </>
            );
        }

        if (job.status === 'failed') {
            return (
                <>
                    <Text style={styles.errorText}>Generation Failed</Text>
                    <Text style={styles.errorSubtext}>
                        {job.error || 'Unknown error'}
                    </Text>
                </>
            );
        }

        // Status is 'complete' but still here (race condition)
        return (
            <>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.successText}>Complete!</Text>
                <Text style={styles.subtext}>Loading 3D viewer...</Text>
            </>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {renderContent()}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    statusText: {
        color: '#fff',
        fontSize: 24,
        fontWeight: '600',
        marginTop: 20,
        textAlign: 'center',
    },
    subtext: {
        color: '#999',
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
        lineHeight: 20,
    },
    hint: {
        color: '#666',
        fontSize: 12,
        marginTop: 24,
        textAlign: 'center',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 24,
        fontWeight: '600',
        marginTop: 20,
    },
    errorSubtext: {
        color: '#ef4444',
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
    },
    successText: {
        color: '#10b981',
        fontSize: 24,
        fontWeight: '600',
        marginTop: 20,
    },
});
