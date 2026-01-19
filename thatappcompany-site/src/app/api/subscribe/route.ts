import { getAdminDb } from "@/lib/firebase/admin";
import { SubscribeSchema } from "@/lib/validators";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = SubscribeSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
        }

        const { email, source } = parsed.data;
        // Allow extended fields if passed (even if not strictly validated by basic schema yet, or expand schema later)
        const extendedData = body;

        const db = getAdminDb();

        if (!db) {
            console.warn("Demo Mode: Simulated subscription for", email);
            return NextResponse.json({ ok: true, mode: 'demo' });
        }

        // Write to 'signups' to match GarageManager structure.
        // Using Safe ID from Email to enable deduplication (Merge Updates).
        const docId = email.toLowerCase().trim().replace(/[^a-z0-9@._-]/g, '_');

        await db.collection("signups").doc(docId).set({
            ...extendedData, // Catch-all for other fields if we update frontend to send them
            email: email.toLowerCase(),
            source: source || "thatappcompany.co",
            status: "new",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }, { merge: true });

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json(
            { ok: false, error: e?.message || "Server error" },
            { status: 500 }
        );
    }
}
