
import { Driver, DutyStatus, ELDStatus, FollowUpStatus } from "../types";

/**
 * Extracts the Spreadsheet ID from various formats of Google Sheets URLs or returns the ID directly.
 */
const extractSheetId = (input: string): string => {
  if (!input) return "";
  const trimmed = input.trim();

  // Try matching the standard /d/[ID]/ pattern first
  const dPathMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (dPathMatch && dPathMatch[1]) return dPathMatch[1];

  // Fallback: Try to find any string that looks like a Google ID (usually ~44 chars)
  const idMatch = trimmed.match(/[a-zA-Z0-9-_]{25,100}/);
  if (idMatch) return idMatch[0];

  return trimmed;
};

/**
 * Fetches data from a Google Sheet.
 * If accessToken is provided, it uses the Google Sheets API v4 (Private/Bidirectional).
 * Otherwise, it falls back to Public CSV export.
 */
export const fetchSheetData = async (input: string, accessToken?: string): Promise<Driver[]> => {
  const sheetId = extractSheetId(input);
  if (!sheetId) throw new Error("Invalid Spreadsheet ID or URL. Please provide a valid Google Sheets link.");

  // If we have a real token (not the demo one), use the authenticated API
  if (accessToken && accessToken !== 'demo_token') {
    return fetchViaApi(sheetId, accessToken);
  }

  // Otherwise try the public export route
  return fetchViaPublicCsv(sheetId);
};

const fetchViaApi = async (sheetId: string, token: string): Promise<Driver[]> => {
  const range = 'A:K';
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const err = await response.json();
      if (response.status === 403 || response.status === 401) {
        throw new Error("Access Denied: Your Google account does not have permission to view this specific spreadsheet.");
      }
      if (response.status === 404) {
        throw new Error("Spreadsheet not found: The ID extracted from your URL appears to be invalid or the sheet was deleted.");
      }
      throw new Error(err.error?.message || "Failed to fetch from Google Sheets API.");
    }

    const data = await response.json();
    const rows: string[][] = data.values || [];

    // Check if sheet has at least header + 1 row
    if (rows.length < 2) return [];

    return rows.slice(1).map<Driver | null>((columns, index) => {
      // Basic validation: name and email are usually required
      if (columns.length < 2) return null;

      const [name, email, eld, duty, follow, company, board, deviceType, appVersion, lastSentAt, emailSent] = columns;
      return {
        id: email || `drv-${index}`,
        name: name || "Unknown",
        email: email || "",
        company: company || "Not Assigned",
        board: board || "Board A",
        deviceType: deviceType || "Unknown Device",
        appVersion: appVersion || "Unknown Version",
        eldStatus: mapELDStatus(eld),
        dutyStatus: mapDutyStatus(duty),
        followUp: mapFollowUpStatus(follow),
        emailSent: emailSent === 'TRUE',
        lastSentAt: (lastSentAt && lastSentAt !== "") ? lastSentAt : null,
        sheetRowIndex: index + 2
      };
    }).filter((d): d is Driver => d !== null);
  } catch (e) {
    console.error("Sheets API Error:", e);
    throw e;
  }
};

const fetchViaPublicCsv = async (sheetId: string): Promise<Driver[]> => {
  // Public CSV export URL requires the sheet to be "Published to the web"
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=0`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("Spreadsheet not found: Check that the URL or ID is correct and the sheet hasn't been deleted.");
      }
      throw new Error("Sheet not accessible: To use public sync, you MUST go to File > Share > Publish to the web in your Google Sheet.");
    }

    const csvText = await response.text();

    // If the sheet is private, Google often responds with a 200 OK but serves a login HTML page instead of CSV
    if (csvText.includes('<!DOCTYPE') || csvText.includes('google-signin') || csvText.includes('login')) {
      throw new Error("Sheet is private: To sync this sheet, either 'Connect Google' in the sidebar or set the sheet to 'Published to the web'.");
    }

    return parseCSVToDrivers(csvText);
  } catch (e) {
    console.error("Public Fetch Error:", e);
    throw e;
  }
};

const parseCSVToDrivers = (csvText: string): Driver[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return [];

  return lines.slice(1).map<Driver | null>((line, index) => {
    // Basic CSV splitting (does not handle commas inside quotes perfectly, but sufficient for this schema)
    const columns = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
    if (columns.length < 2) return null;

    const [name, email, eld, duty, follow, company, board, deviceType, appVersion, lastSentAt, emailSent] = columns;
    return {
      id: email || `drv-${index}`,
      name: name || "Unknown",
      email: email || "",
      company: company || "Not Assigned",
      board: board || "Board A",
      deviceType: deviceType || "Unknown Device",
      appVersion: appVersion || "Unknown Version",
      eldStatus: mapELDStatus(eld),
      dutyStatus: mapDutyStatus(duty),
      followUp: mapFollowUpStatus(follow),
      emailSent: emailSent === 'TRUE',
      lastSentAt: (lastSentAt && lastSentAt !== "") ? lastSentAt : null,
    };
  }).filter((d): d is Driver => d !== null);
};

/**
 * Appends a new driver to the connected Google Sheet.
 */
export const appendDriverToSheet = async (sheetIdInput: string, driver: Driver, token: string) => {
  const sheetId = extractSheetId(sheetIdInput);
  if (!sheetId) return;

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A:K:append?valueInputOption=USER_ENTERED`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [[driver.name, driver.email, driver.eldStatus, driver.dutyStatus, driver.followUp, driver.company, driver.board, driver.deviceType, driver.appVersion, driver.lastSentAt || "", driver.emailSent ? 'TRUE' : 'FALSE']]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Append Error:", err);
    }
  } catch (e) {
    console.error("Failed to append driver to sheet", e);
  }
};

/**
 * Updates an existing driver row in Google Sheets.
 */
export const updateDriverInSheet = async (sheetIdInput: string, driver: Driver, token: string) => {
  if (!driver.sheetRowIndex) return;

  const sheetId = extractSheetId(sheetIdInput);
  if (!sheetId) return;

  const range = `A${driver.sheetRowIndex}:K${driver.sheetRowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueInputOption=USER_ENTERED`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [[driver.name, driver.email, driver.eldStatus, driver.dutyStatus, driver.followUp, driver.company, driver.board, driver.deviceType, driver.appVersion, driver.lastSentAt || "", driver.emailSent ? 'TRUE' : 'FALSE']]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Update Error:", err);
    }
  } catch (e) {
    console.error("Failed to update driver in sheet", e);
  }
};

/**
 * Clears a driver's row in Google Sheets (used for deletion).
 */
export const clearDriverRow = async (sheetIdInput: string, rowIndex: number, token: string) => {
  const sheetId = extractSheetId(sheetIdInput);
  if (!sheetId || !rowIndex) return;

  const range = `A${rowIndex}:K${rowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}:clear`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const err = await response.json();
      console.error("Clear Row Error:", err);
    }
  } catch (e) {
    console.error("Failed to clear driver row in sheet", e);
  }
};

const mapELDStatus = (val: string): ELDStatus | null => {
  if (!val || val.trim() === "") return null;
  const v = val.trim().toLowerCase();
  if (v.includes('disconnected') || v.includes('off') || v.includes('inactive')) return ELDStatus.DISCONNECTED;
  if (v.includes('connected') || v.includes('on') || v.includes('active')) return ELDStatus.CONNECTED;
  return ELDStatus.CONNECTED;
};

const mapDutyStatus = (val: string): DutyStatus | null => {
  if (!val || val.trim() === "") return null;
  const v = val.toLowerCase();
  if (v.includes('driving')) return DutyStatus.DRIVING;
  if (v.includes('on duty') || v.includes('on-duty')) return DutyStatus.ON_DUTY;
  if (v.includes('off duty') || v.includes('off-duty')) return DutyStatus.OFF_DUTY;
  if (v.includes('sleep')) return DutyStatus.SLEEPER;
  return DutyStatus.NOT_SET;
};

const mapFollowUpStatus = (val: string): FollowUpStatus | null => {
  if (!val || val.trim() === "") return null;
  const v = val.toLowerCase();
  if (v.includes('action')) return FollowUpStatus.ACTION_REQUIRED;
  if (v.includes('connect')) return FollowUpStatus.CONNECT;
  return FollowUpStatus.NONE;
};
