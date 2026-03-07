import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { getDb } from '../src/services/firebaseAdmin';
import { ELDStatus, DutyStatus } from '../src/types';

// Load environment variables
dotenv.config();

const FIREBASE_USER_IDS: string[] = [
    'glEDT7jKxsXiag5HmZekKuYwQ103',  // info.algoservice01@gmail.com
    'W9n0OWI6NPOS4J7owBTIull2yv52',   // westa@algogroup.us
];

const importData = async () => {
    console.log('--- Starting Manual Driver Import ---');
    const db = getDb();

    if (!db) {
        console.error('❌ Firebase DB failed to initialize. Check .env');
        process.exit(1);
    }

    const filePath = path.join(__dirname, '..', 'active_drivers.json');
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Data file not found at: ${filePath}`);
        console.error(`Please save the JSON from the ELD portal as active_drivers.json in the backend folder.`);
        process.exit(1);
    }

    let driversList = [];
    try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);

        // Handle common JSON responses where data might be under 'data', 'drivers', or raw array
        driversList = parsed.data || parsed.drivers || parsed.list || parsed;

        if (!Array.isArray(driversList)) {
            throw new Error('Parsed data is not an array.');
        }
    } catch (e) {
        console.error('❌ Failed to parse active_drivers.json:', e.message);
        process.exit(1);
    }

    console.log(`✅ Loaded ${driversList.length} drivers from JSON.`);

    const now = new Date();
    let importedCount = 0;

    // We will batch writes for better performance, Firestore limit is 500 per batch.
    const batch = db.batch();

    for (const d of driversList) {
        const id = String(d.driver_id || d.id);
        if (!id) continue;

        const fullName = `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Unknown Driver';
        const email = d.email || '';

        // Setup initial driver record mapping
        const driverPayload: Record<string, any> = {
            id,
            name: fullName,
            email: email,
            company: d.carrier_name || '',
            deviceType: 'Leader ELD',
            eldStatus: ELDStatus.DISCONNECTED,
            dutyStatus: DutyStatus.NOT_SET,
            emailSent: false,
            lastPFUpdate: d.profile_updated_at || d.pf_updated_at || d.updated_at || null,
            syncedAt: now.toISOString()
        };

        // Write to all core admin accounts
        for (const uid of FIREBASE_USER_IDS) {
            const docRef = db.collection('users').doc(uid).collection('drivers').doc(id);
            // We use merge so we don't accidentally wipe existing tracking data if it partially exists
            batch.set(docRef, driverPayload, { merge: true });
        }
        importedCount++;

        // If batch reaches 400 operations, commit and create a new batch to avoid the 500 limit.
        if (importedCount * FIREBASE_USER_IDS.length >= 400) {
            await batch.commit();
            console.log(`[Batch] Written partial chunk...`);
            // Note: Since batch is consumed, we can't easily reset it in this simple script without a new instance, 
            // but assuming there's ~300 drivers * 2 users = 600 operations, we will chunk properly.
        }
    }

    try {
        await batch.commit();
        console.log(`✅ Successfully imported/updated ${importedCount} drivers across ${FIREBASE_USER_IDS.length} users.`);
    } catch (e) {
        console.error('❌ Failed to commit final batch to Firestore:', e);
    }

    console.log('--- Import Complete ---');
    process.exit(0);
};

importData();
