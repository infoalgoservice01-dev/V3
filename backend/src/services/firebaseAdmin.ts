import * as admin from 'firebase-admin';

/**
 * Firebase Admin SDK — initialized from environment variables.
 * No JSON key file required. Set these in backend/.env:
 *   FIREBASE_PROJECT_ID
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 */
let db: admin.firestore.Firestore | null = null;

try {
    if (!admin.apps.length) {
        const projectId = process.env.FIREBASE_PROJECT_ID;
        const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
        // Private key comes from .env with escaped newlines — unescape them
        const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

        if (projectId && clientEmail && privateKey) {
            admin.initializeApp({
                credential: admin.credential.cert({ projectId, clientEmail, privateKey })
            });
            db = admin.firestore();
            console.log(`[FIREBASE] ✅ Admin SDK connected to project: ${projectId}`);
        } else {
            console.warn('[FIREBASE] ⚠️  Missing FIREBASE_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY in .env');
            console.warn('[FIREBASE]   Running in SIMULATION mode — no Firestore writes will occur.');
        }
    }
} catch (e) {
    console.error('[FIREBASE] ❌ Initialization error:', e);
}

export const getDb = () => db;
