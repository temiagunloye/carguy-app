import { adminDb } from '@/lib/firebase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    // Todo: Verify authorization header for secure sync trigger

    try {
        // 1. Fetch metadata from platforms (Mocked for v1)
        const platforms = [
            {
                platformName: 'ThatAppCompany',
                baseUrl: 'https://thatappcompany.com',
                repoName: 'thatappcompany-hub',
                status: 'active',
                lastUpdated: new Date()
            },
            {
                platformName: 'GarageManager',
                baseUrl: 'https://garagemanager.co',
                repoName: 'carguy-app',
                status: 'active',
                lastUpdated: new Date()
            }
        ];

        const batch = adminDb.batch();

        // 2. Update Firestore
        for (const p of platforms) {
            const ref = adminDb.collection('platform_sites').doc(p.repoName);
            batch.set(ref, p, { merge: true });
        }

        // 3. Log Activity
        const activityRef = adminDb.collection('admin_activity').doc();
        batch.set(activityRef, {
            type: 'sync',
            message: 'Platform sync completed successfully.',
            platform: 'unified-hub',
            createdAt: new Date()
        });

        await batch.commit();

        return NextResponse.json({ success: true, count: platforms.length });
    } catch (error) {
        console.error('Sync Error:', error);
        return NextResponse.json({ error: 'Sync Failed' }, { status: 500 });
    }
}
