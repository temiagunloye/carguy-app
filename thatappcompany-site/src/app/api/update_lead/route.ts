import { getAdminDb } from "@/lib/firebase/admin";
import { NextResponse } from "next/server";
import { z } from "zod";

const UpdateSchema = z.object({
    email: z.string().email(),
    status: z.string()
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = UpdateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
        }

        const { email, status } = parsed.data;
        const db = getAdminDb();

        if (!db) return NextResponse.json({ ok: true, mode: 'demo' });

        const signupsRef = db.collection('signups');
        const snapshot = await signupsRef.where('email', '==', email).get();

        if (snapshot.empty) {
            return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
        }

        // Update all matching docs (duplicates shouldn't exist but good practice to handle)
        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.update(doc.ref, { status, updatedAt: new Date().toISOString() });
        });
        await batch.commit();

        return NextResponse.json({ ok: true });

    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
}
