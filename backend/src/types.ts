export enum DutyStatus {
    DRIVING = 'Driving',
    ON_DUTY = 'On Duty',
    OFF_DUTY = 'Off Duty',
    SLEEPER = 'Sleep',
    NOT_SET = 'Not Set'
}

export enum ELDStatus {
    CONNECTED = 'Connected',
    DISCONNECTED = 'Disconnected'
}

export interface Driver {
    id: string;
    name: string;
    email: string;
    company: string;
    board: string;
    deviceType: string;
    appVersion: string;
    eldStatus: ELDStatus | null;
    dutyStatus: DutyStatus | null;
    emailSent: boolean;
    lastPFUpdate?: string | null;
    last3DayEmail?: string | null;
    last5DayEmail?: string | null;
}

export interface ELDDriverPayload {
    driverId: string;
    fullName: string;
    emailAddress: string;
    coordinates: { lat: number; lng: number };
    isConnected: boolean;
    dutyStatus: DutyStatus;
    lastProfileUpdateIso: string | null;
}
