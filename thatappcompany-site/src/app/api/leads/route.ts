import { LAUNCH_TIMESTAMP } from "@/lib/config";
import { getAdminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const db = getAdminDb();

    // Demo Mode
    if (!db) {
        return NextResponse.json({
            mode: 'demo',
            leads: [
                { email: 'demo@example.com', role: 'Enthusiast', planInterest: 'Pro', carBuild: 'Turbo K24 Civic', source: 'instagram', createdAt: new Date().toISOString() },
                { email: 'shop@example.com', role: 'Shop', planInterest: 'Premium', carBuild: 'Client builds', source: 'direct', createdAt: new Date(Date.now() - 86400000).toISOString() }
            ]
        });
    }

    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '100');

        const signupsRef = db.collection('signups');
        const snapshot = await signupsRef
            .where('createdAt', '>=', LAUNCH_TIMESTAMP)
            .where('source', '==', 'thatappcompany.co')
            .orderBy('createdAt', 'desc')
            .limit(limit)
            .get();

        const leads = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        return NextResponse.json({
            mode: 'live',
            leads
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
