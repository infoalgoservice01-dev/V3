import { fetchELDData } from './eldFetcher';
import { sendReminderEmail, sendDisconnectionEmail } from './emailSender';
import { getDb } from './firebaseAdmin';
import { ELDDriverPayload, ELDStatus, DutyStatus } from '../types';

/**
 * Firebase user IDs that should receive the synced driver data.
 * All accounts listed here will see the same 366 drivers in their dashboard.
 */
const FIREBASE_USER_IDS: string[] = [
    'glEDT7jKxsXiag5HmZekKuYwQ103',  // info.algoservice01@gmail.com
    'W9n0OWI6NPOS4J7owBTIull2yv52',   // westa@algogroup.us
];

export const runSyncWorker = async () => {
    console.log('\n================================');
    console.log('[WORKER] Starting ELD sync cycle...');
    console.log(`[WORKER] Time: ${new Date().toISOString()}`);
    console.log('================================');

    const now = new Date();
    const db = getDb();
    const userIds = process.env.FIREBASE_USER_ID
        ? [process.env.FIREBASE_USER_ID, ...FIREBASE_USER_IDS.filter(id => id !== process.env.FIREBASE_USER_ID)]
        : FIREBASE_USER_IDS;

    console.log(`[WORKER] Writing to ${userIds.length} user account(s): ${userIds.join(', ')}`);

    // 1. Fetch live fleet data from Leader ELD API (paginated)
    const liveDrivers = await fetchELDData();

    let processedCount = 0;
    let emailsSent = 0;
    let writtenCount = 0;

    for (const eldDriver of liveDrivers) {
        processedCount++;
        const driverId = eldDriver.driverId;

        // 2. Read last known reminder timestamps from the primary user's Firestore doc
        let last3DayEmail: string | null = null;
        let last5DayEmail: string | null = null;
        let lastDisconnectEmail: string | null = null;
        let existingData: any = {};

        if (db) {
            try {
                // Read state from first user's record
                const doc = await db.collection('users').doc(userIds[0]).collection('drivers').doc(driverId).get();
                if (doc.exists) {
                    existingData = doc.data() || {};
                    last3DayEmail = existingData.last3DayEmail || null;
                    last5DayEmail = existingData.last5DayEmail || null;
                    lastDisconnectEmail = existingData.lastDisconnectEmail || null;
                }
            } catch (e) {
                console.warn(`[WORKER] Could not read Firestore for driver ${driverId}:`, e);
            }
        }

        // 3. Calculate inactivity
        let daysInactive = 0;
        let status = 'ok';
        let needs3DayEmail = false;
        let needs5DayEmail = false;
        let updatedLast3DayEmail = last3DayEmail;
        let updatedLast5DayEmail = last5DayEmail;
        let updatedDisconnectEmail = lastDisconnectEmail;

        if (eldDriver.lastProfileUpdateIso) {
            const lastUpdate = new Date(eldDriver.lastProfileUpdateIso);
            daysInactive = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

            if (daysInactive >= 5) status = '5_day_pending';
            else if (daysInactive >= 3) status = '3_day_pending';
            else if (daysInactive === 2) status = 'warning';

            // Single-send-per-cycle logic
            needs3DayEmail = status === '3_day_pending' &&
                (!last3DayEmail || new Date(last3DayEmail).getTime() < lastUpdate.getTime());
            needs5DayEmail = status === '5_day_pending' &&
                (!last5DayEmail || new Date(last5DayEmail).getTime() < lastUpdate.getTime());
        }

        // 4. Disconnection alert — max once per day
        const needsDisconnectEmail = !eldDriver.isConnected && eldDriver.emailAddress &&
            (!lastDisconnectEmail || new Date(lastDisconnectEmail).toDateString() !== now.toDateString());

        // 5. Send emails
        if (needs3DayEmail && eldDriver.emailAddress) {
            console.log(`[WORKER] 📧 3-day reminder → ${eldDriver.fullName} (${eldDriver.emailAddress})`);
            const sent = await sendReminderEmail(eldDriver.emailAddress, eldDriver.fullName, 3);
            if (sent) { updatedLast3DayEmail = now.toISOString(); emailsSent++; }
        }

        if (needs5DayEmail && eldDriver.emailAddress) {
            console.log(`[WORKER] 📧 5-day reminder → ${eldDriver.fullName} (${eldDriver.emailAddress})`);
            const sent = await sendReminderEmail(eldDriver.emailAddress, eldDriver.fullName, 5);
            if (sent) { updatedLast5DayEmail = now.toISOString(); emailsSent++; }
        }

        if (needsDisconnectEmail) {
            console.log(`[WORKER] 🔴 Disconnection alert → ${eldDriver.fullName}`);
            const sent = await sendDisconnectionEmail(eldDriver.emailAddress, eldDriver.fullName);
            if (sent) { updatedDisconnectEmail = now.toISOString(); emailsSent++; }
        }

        // 6. Write to Firestore at users/{userId}/drivers/{driverId}
        //    Matches the exact Driver interface the React frontend uses
        const driverPayload: Record<string, any> = {
            id: driverId,
            name: eldDriver.fullName,
            email: eldDriver.emailAddress,
            // Preserve existing values for fields not provided by ELD
            company: existingData.company || '',
            board: existingData.board || '',
            deviceType: existingData.deviceType || 'Leader ELD',
            appVersion: existingData.appVersion || '',
            // Live ELD data
            eldStatus: eldDriver.isConnected ? ELDStatus.CONNECTED : ELDStatus.DISCONNECTED,
            dutyStatus: eldDriver.dutyStatus || DutyStatus.NOT_SET,
            emailSent: existingData.emailSent || false,
            followUp: existingData.followUp || null,
            // Profile form tracking
            lastPFUpdate: eldDriver.lastProfileUpdateIso,
            last3DayEmail: updatedLast3DayEmail,
            last5DayEmail: updatedLast5DayEmail,
            lastDisconnectEmail: updatedDisconnectEmail,
            // GPS coordinates for map display
            gpsLoc: eldDriver.coordinates,
            // Metadata
            syncedAt: now.toISOString()
        };

        if (db) {
            // Write to ALL user collections so every admin sees the same data
            const writePromises = userIds.map(uid =>
                db!.collection('users').doc(uid).collection('drivers')
                    .doc(driverId)
                    .set(driverPayload, { merge: true })
                    .catch((e: any) => console.error(`[WORKER] ❌ Write failed for ${eldDriver.fullName} to user ${uid}:`, e))
            );
            await Promise.all(writePromises);
            writtenCount++;
        } else {
            console.log(`[SIM] ${eldDriver.fullName} | ${eldDriver.isConnected ? '🟢 Connected' : '🔴 Disconnected'} | ${status} | Days inactive: ${daysInactive}`);
        }
    }

    console.log('================================');
    console.log(`[WORKER] ✅ Sync complete!`);
    console.log(`[WORKER]    Processed: ${processedCount} drivers`);
    console.log(`[WORKER]    Firestore writes: ${writtenCount}`);
    console.log(`[WORKER]    Emails sent: ${emailsSent}`);
    console.log('================================\n');
};
