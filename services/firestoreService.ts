import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    Timestamp,
    onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase.config';
import { Driver, EmailLogEntry, DriverReply } from '../types';

/**
 * Initialize user database on first login
 */
export const initializeUserDatabase = async (userId: string, userEmail: string, userName: string) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
        await setDoc(userRef, {
            email: userEmail,
            name: userName,
            createdAt: Timestamp.now(),
            hasImportedFromSheets: false
        });
        console.log(`✅ User database initialized for ${userEmail}`);
    }

    return userSnap.exists();
};

/**
 * Check if user has already imported data from Google Sheets
 */
export const hasImportedFromSheets = async (userId: string): Promise<boolean> => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() && userSnap.data()?.hasImportedFromSheets === true;
};

/**
 * Mark that user has imported data from Google Sheets
 */
export const markSheetsImported = async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        hasImportedFromSheets: true,
        importedAt: Timestamp.now()
    });
};

/**
 * Fetch all drivers for a user
 */
export const fetchDrivers = async (userId: string): Promise<Driver[]> => {
    const driversRef = collection(db, 'users', userId, 'drivers');
    const snapshot = await getDocs(driversRef);

    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
    } as Driver));
};

/**
 * Add a new driver
 */
export const addDriver = async (userId: string, driver: Driver) => {
    const driverRef = doc(db, 'users', userId, 'drivers', driver.id);
    await setDoc(driverRef, {
        ...driver,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
    });
};

/**
 * Bulk add drivers (for Google Sheets import)
 */
export const bulkAddDrivers = async (userId: string, drivers: Driver[]) => {
    const promises = drivers.map(driver => addDriver(userId, driver));
    await Promise.all(promises);
};

/**
 * Update an existing driver
 */
export const updateDriver = async (userId: string, driverId: string, updates: Partial<Driver>) => {
    const driverRef = doc(db, 'users', userId, 'drivers', driverId);
    await updateDoc(driverRef, {
        ...updates,
        updatedAt: Timestamp.now()
    });
};

/**
 * Delete a driver
 */
export const deleteDriver = async (userId: string, driverId: string) => {
    const driverRef = doc(db, 'users', userId, 'drivers', driverId);
    await deleteDoc(driverRef);
};

/**
 * Fetch email logs for a user
 */
export const fetchEmailLogs = async (userId: string): Promise<EmailLogEntry[]> => {
    const logsRef = collection(db, 'users', userId, 'emailLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
    } as EmailLogEntry));
};

/**
 * Add an email log entry
 */
export const addEmailLog = async (userId: string, log: EmailLogEntry) => {
    const logRef = doc(db, 'users', userId, 'emailLogs', log.id);
    await setDoc(logRef, {
        ...log,
        timestamp: Timestamp.fromDate(new Date(log.timestamp))
    });
};

/**
 * Fetch driver replies for a user
 */
export const fetchDriverReplies = async (userId: string): Promise<DriverReply[]> => {
    const repliesRef = collection(db, 'users', userId, 'driverReplies');
    const q = query(repliesRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
    } as DriverReply));
};

/**
 * Add a driver reply
 */
export const addDriverReply = async (userId: string, reply: DriverReply) => {
    const replyRef = doc(db, 'users', userId, 'driverReplies', reply.id);
    await setDoc(replyRef, {
        ...reply,
        timestamp: Timestamp.fromDate(new Date(reply.timestamp))
    });
};

/**
 * Subscribe to real-time driver updates
 */
export const subscribeToDrivers = (userId: string, callback: (drivers: Driver[]) => void) => {
    const driversRef = collection(db, 'users', userId, 'drivers');

    return onSnapshot(driversRef, (snapshot) => {
        const drivers = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as Driver));
        callback(drivers);
    });
};

/**
 * Subscribe to real-time email log updates
 */
export const subscribeToEmailLogs = (userId: string, callback: (logs: EmailLogEntry[]) => void) => {
    const logsRef = collection(db, 'users', userId, 'emailLogs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as EmailLogEntry));
        callback(logs);
    });
};

/**
 * Subscribe to real-time driver reply updates
 */
export const subscribeToDriverReplies = (userId: string, callback: (replies: DriverReply[]) => void) => {
    const repliesRef = collection(db, 'users', userId, 'driverReplies');
    const q = query(repliesRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (snapshot) => {
        const replies = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
        } as DriverReply));
        callback(replies);
    });
};
