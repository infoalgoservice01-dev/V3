import axios, { AxiosInstance } from 'axios';
import { ELDDriverPayload, DutyStatus, ELDStatus } from '../types';

/**
 * Leader ELD API Integration
 * Backend: api.drivehos.app/api/v1
 * Auth: POST /auth/login → Bearer token
 * Drivers: GET /drivers  
 * HOS/Live Status: GET /hos/system-list
 */

const BASE_URL = process.env.ELD_API_BASE_URL || 'https://api.drivehos.app/api/v1';
let authToken: string | null = null;
let tokenExpiry: number = 0;
let tenantId: string | null = null;

// Axios instance needs to be created, but we will use request interceptor or set baseURL later 
// if it changes dynamically, but typically process.env.ELD_API_BASE_URL is static enough if dotenv is loaded early.
// To be safe against top-level dotenv loading, we use process.env where needed.
const eldApi: AxiosInstance = axios.create({
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' }
});

// Interceptor to ensure baseURL is fresh
eldApi.interceptors.request.use((config) => {
    config.baseURL = process.env.ELD_API_BASE_URL || 'https://api.drivehos.app/api/v1';
    return config;
});

/**
 * Authenticate and get a fresh Bearer token.
 * Called automatically before any data request.
 */
const authenticate = async (): Promise<string> => {
    const now = Date.now();

    // Return cached token if still valid (within 50 mins)
    if (authToken && now < tokenExpiry) {
        return authToken;
    }

    console.log('[ELD AUTH] Logging in to Leader ELD (drivehos.app)...');

    // Best approach: If user provided a permanent API Key, use it.
    if (process.env.ELD_API_KEY) {
        console.log('[ELD AUTH] Using provided ELD_API_KEY (bypassing login).');
        return process.env.ELD_API_KEY;
    }

    const email = process.env.ELD_API_USERNAME;
    const password = process.env.ELD_API_PASSWORD;

    if (!email || !password) {
        throw new Error('[ELD AUTH] Missing ELD_API_KEY or ELD_API_USERNAME/PASSWORD in .env');
    }

    const res = await eldApi.post('/auth/login', { email, password, recaptcha_token: 'bypass', recaptcha: '' });

    // Extract token — common patterns: res.data.token, res.data.access_token, res.data.data.token
    const token =
        res.data?.token ||
        res.data?.access_token ||
        res.data?.data?.token ||
        res.data?.data?.access_token;

    if (!token) {
        console.error('[ELD AUTH] Login response:', JSON.stringify(res.data, null, 2));
        throw new Error('[ELD AUTH] Could not find token in login response. See above for full response.');
    }

    // Extract tenant_id from login if not already set
    if (!tenantId) {
        tenantId =
            res.data?.tenant_id ||
            res.data?.data?.tenant_id ||
            res.data?.user?.tenant_id ||
            null;
        if (tenantId) console.log(`[ELD AUTH] Tenant ID resolved from login: ${tenantId}`);
    }

    authToken = token;
    tokenExpiry = now + 50 * 60 * 1000; // Cache for 50 minutes

    console.log('[ELD AUTH] ✅ Authenticated successfully.');
    return token;
};

/**
 * Build headers for authenticated ELD requests.
 */
const buildHeaders = (token: string) => {
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`
    };
    const currentTenantId = tenantId || process.env.ELD_TENANT_ID;
    if (currentTenantId) {
        headers['tenant_id'] = currentTenantId;
    }
    return headers;
};

/**
 * Fetch all drivers from Leader ELD, including real-time HOS status.
 * Merges /drivers (identity) + /hos/system-list (location, connection, duty).
 */
export const fetchELDData = async (): Promise<ELDDriverPayload[]> => {
    // Ensure required credentials are present
    if (!process.env.ELD_API_KEY && (!process.env.ELD_API_USERNAME || !process.env.ELD_API_PASSWORD)) {
        console.warn('[ELD] Missing ELD API credentials; returning empty driver list.');
        return [];
    }
    const token = await authenticate();
    const headers = buildHeaders(token);

    console.log('[ELD] Fetching ALL drivers from /drivers (paginated)...');

    // --- Step 1: Paginate through ALL drivers ---
    const rawDrivers: any[] = [];
    let page = 1;
    const PAGE_SIZE = 100;

    while (true) {
        const driversRes = await eldApi.get('/drivers', {
            headers,
            params: { page, limit: PAGE_SIZE, tab: 'active', status: 'active', group: 'all', sortBy: 'driver', orderBy: 'asc' }
        });

        const pageData: any[] = driversRes.data?.data || driversRes.data?.drivers || driversRes.data || [];
        if (!Array.isArray(pageData) || pageData.length === 0) break;

        rawDrivers.push(...pageData);
        console.log(`[ELD] /drivers page ${page}: fetched ${pageData.length} (total so far: ${rawDrivers.length})`);

        // Stop if we got fewer results than the page size — means we're on the last page
        if (pageData.length < PAGE_SIZE) break;
        page++;
    }

    console.log(`[ELD] ✅ Total drivers fetched: ${rawDrivers.length}`);

    // --- Step 2: Paginate through all HOS/location/connection records ---
    console.log('[ELD] Fetching live HOS status from /hos/system-list (paginated)...');
    const rawHos: any[] = [];
    let hosPage = 1;

    while (true) {
        const hosRes = await eldApi.get('/hos/system-list', {
            headers,
            params: { page: hosPage, limit: PAGE_SIZE, eld_status: 'all', duty_status: 'all' }
        });

        const hosPageData: any[] = hosRes.data?.data || hosRes.data?.list || hosRes.data || [];
        if (!Array.isArray(hosPageData) || hosPageData.length === 0) break;

        rawHos.push(...hosPageData);
        console.log(`[ELD] /hos/system-list page ${hosPage}: fetched ${hosPageData.length} (total so far: ${rawHos.length})`);

        if (hosPageData.length < PAGE_SIZE) break;
        hosPage++;
    }

    console.log(`[ELD] ✅ Total HOS records fetched: ${rawHos.length}`);

    // Build a quick lookup map by driver_id for HOS data
    const hosMap: Record<string, any> = {};
    for (const hos of rawHos) {
        const id = hos.driver_id || hos.id;
        if (id) hosMap[id] = hos;
    }

    // --- Step 3: Merge and normalize ---
    const enriched: ELDDriverPayload[] = rawDrivers.map((d: any) => {
        const id = d.driver_id || d.id;
        const hos = hosMap[id] || {};

        // Normalize duty status
        const rawDuty = (hos.duty_status || d.duty_status || '').toLowerCase();
        let dutyStatus = DutyStatus.NOT_SET;
        if (rawDuty.includes('driving')) dutyStatus = DutyStatus.DRIVING;
        else if (rawDuty.includes('on_duty') || rawDuty.includes('on duty')) dutyStatus = DutyStatus.ON_DUTY;
        else if (rawDuty.includes('off_duty') || rawDuty.includes('off duty')) dutyStatus = DutyStatus.OFF_DUTY;
        else if (rawDuty.includes('sleeper') || rawDuty.includes('sleep')) dutyStatus = DutyStatus.SLEEPER;

        // Connection status
        const isConnected = hos.online === true || hos.eld_status === true || hos.eld_status === 'connected';

        // GPS coordinates
        const lat = parseFloat(hos.lat || hos.latitude || hos.gps_lat || '0');
        const lng = parseFloat(hos.lon || hos.lng || hos.longitude || hos.gps_lon || '0');

        // Profile form last updated — use driver's own updated_at field
        const lastProfileUpdateIso = d.profile_updated_at || d.pf_updated_at || d.updated_at || null;

        return {
            driverId: String(id),
            fullName: `${d.first_name || ''} ${d.last_name || ''}`.trim() || 'Unknown Driver',
            emailAddress: d.email || '',
            coordinates: { lat, lng },
            isConnected,
            dutyStatus,
            lastProfileUpdateIso
        };
    });

    console.log(`[ELD] ✅ Successfully enriched ${enriched.length} drivers.`);
    return enriched;
};
