import { getAdminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const TrackSchema = z.object({
    type: z.enum(['pageview', 'event']),
    path: z.string().optional(),
    eventName: z.string().optional(),
    userId: z.string().optional(),
    referrer: z.string().optional()
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = TrackSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
        }

        const { type, path, eventName, userId, referrer } = parsed.data;
        const db = getAdminDb();

        if (!db) return NextResponse.json({ ok: true, mode: 'demo' });

        const timestamp = new Date().toISOString();

        if (type === 'pageview') {
            await db.collection('pageViews').add({
                path: path || '/',
                userId: userId || 'anon',
                referrer: referrer || '',
                timestamp
            });
        } else if (type === 'event') {
            await db.collection('events').add({
                eventName: eventName || 'unknown',
                path: path || '/',
                userId: userId || 'anon',
                timestamp
            });
        }

        return NextResponse.json({ ok: true });

    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
