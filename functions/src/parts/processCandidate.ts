import axios from 'axios';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// Extract OpenGraph metadata using regex
function extractMeta(html: string) {
    const getMeta = (prop: string) => {
        const regex = new RegExp(`<meta property="${prop}" content="([^"]*)"`, 'i');
        const match = html.match(regex);
        return match ? match[1] : null;
    };

    // Fallback for title
    const getTitle = () => {
        const match = html.match(/<title>([^<]*)<\/title>/i);
        return match ? match[1] : null;
    };

    return {
        title: getMeta('og:title') || getTitle(),
        image: getMeta('og:image'),
        description: getMeta('og:description'),
        siteName: getMeta('og:site_name')
    };
}

// Mock Matcher Logic
function matchPart(extracted: any) {
    const text = (extracted.title + ' ' + extracted.description).toLowerCase();

    // Example: keyword matching
    if (text.includes('wheel') || text.includes('rim')) return 'wheel';
    if (text.includes('exhaust') || text.includes('muffler')) return 'exhaust';
    if (text.includes('spoiler') || text.includes('wing')) return 'spoiler';

    return 'other';
}

export const processCandidate = functions.firestore
    .document('partCandidates/{candidateId}')
    .onCreate(async (snap, context) => {
        const data = snap.data();
        if (!data || !data.input || data.input.type !== 'link' || !data.input.url) return;

        const { url } = data.input;
        const candidateRef = snap.ref;

        try {
            // 1. Update status to processing
            await candidateRef.update({ status: 'processing' });

            // 2. Fetch HTML
            console.log(`Fetching URL: ${url}`);
            const response = await axios.get(url, {
                headers: { 'User-Agent': 'CarGuyBot/1.0' },
                timeout: 10000
            });
            const html = response.data;

            // 3. Extract Metadata
            const extracted = extractMeta(html);
            console.log('Extracted:', extracted);

            // 4. Match
            const category = matchPart(extracted);
            let resolution = { mode: 'community_ref' };

            // Mock "3D Match" if known brand
            if (extracted.title && extracted.title.toLowerCase().includes('borla')) {
                resolution = {
                    mode: '3d_match',
                    // matchedPartId: 'exhaust_borla_stype', // example
                } as any;
            }

            // 5. Update Doc
            await candidateRef.update({
                status: 'resolved',
                extracted: {
                    ...extracted,
                    detectedCategory: category
                },
                resolution,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

        } catch (error: any) {
            console.error('Extraction failed:', error);
            await candidateRef.update({
                status: 'failed',
                error: error.message,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }
    });
