import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as cron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { runSyncWorker } from './services/syncWorker';
import { fetchELDData } from './services/eldFetcher';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

let isSyncing = false;
let cronJob: ScheduledTask | null = null;
let lastSyncTime: string | null = null;

// Start the cron job to run every hour at minute 0
export const startCron = () => {
    if (cronJob) return;

    // Default: Run every hour '0 * * * *'. For testing, we can use '* * * * *' (every minute)
    const schedule = process.env.CRON_SCHEDULE || '0 * * * *';
    console.log(`[CRON] Starting Scheduler: ${schedule}`);

    cronJob = cron.schedule(schedule, async () => {
        if (isSyncing) {
            console.log('[CRON] Sync already in progress, skipping tick.');
            return;
        }

        isSyncing = true;
        try {
            console.log(`[CRON] Executing Sync Worker at ${new Date().toISOString()}`);
            await runSyncWorker();
            lastSyncTime = new Date().toISOString();
        } catch (error) {
            console.error('[CRON] Error during sync loop:', error);
        } finally {
            isSyncing = false;
        }
    });
};

export const stopCron = () => {
    if (cronJob) {
        cronJob.stop();
        cronJob = null;
        console.log('[CRON] Scheduler Stopped');
    }
};

// Start it immediately
startCron();

// API Routes
app.get('/api/status', (req, res) => {
    res.json({
        status: 'online',
        cronActive: !!cronJob,
        lastSyncTime,
        isSyncing
    });
});

// New endpoint: Get driver data from ELD API
app.get('/api/eld/drivers', async (req, res) => {
    try {
        const drivers = await fetchELDData();
        res.json({ drivers });
    } catch (e) {
        console.error('[API] Error fetching ELD drivers:', e);
        res.status(500).json({ error: 'Failed to fetch driver data' });
    }
});

app.post('/api/sync/start', (req, res) => {
    startCron();
    res.json({ message: 'Cron started' });
});

app.post('/api/sync/stop', (req, res) => {
    stopCron();
    res.json({ message: 'Cron stopped' });
});

app.post('/api/sync/trigger', async (req, res) => {
    if (isSyncing) { res.status(400).json({ error: 'Already syncing' }); return; }

    try {
        isSyncing = true;
        await runSyncWorker();
        lastSyncTime = new Date().toISOString();
        res.json({ message: 'Manual sync complete', lastSyncTime });
    } catch (e) {
        res.status(500).json({ error: 'Sync failed' });
    } finally {
        isSyncing = false;
    }
});

app.listen(PORT, () => {
    console.log(`✅ Backend Server listening on port ${PORT}`);
});
