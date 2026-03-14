
import { Driver, DutyStatus, ELDStatus, FollowUpStatus } from './types';

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: '1',
    name: 'John Miller',
    email: 'john.m@trucking-co.com',
    company: 'Alpha Logistics',
    board: 'Board A',
    deviceType: 'Samsung Tab A8',
    appVersion: 'v4.2.1',
    eldStatus: ELDStatus.CONNECTED,
    dutyStatus: DutyStatus.DRIVING,
    followUp: FollowUpStatus.NONE,
    emailSent: false,
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    email: 's.jenkins@trucking-co.com',
    company: 'Global Freight',
    board: 'Board B',
    deviceType: 'iPad Mini 6',
    appVersion: 'v4.1.9',
    eldStatus: ELDStatus.DISCONNECTED,
    dutyStatus: DutyStatus.OFF_DUTY,
    followUp: FollowUpStatus.ACTION_REQUIRED,
    emailSent: true,
    lastEmailTime: '2023-10-27T08:30:00Z',
  },
  {
    id: '3',
    name: 'Robert Davis',
    email: 'r.davis@trucking-co.com',
    company: 'Alpha Logistics',
    board: 'Board A',
    deviceType: 'Android Tablet',
    appVersion: 'v4.2.0',
    eldStatus: ELDStatus.CONNECTED,
    dutyStatus: DutyStatus.ON_DUTY,
    followUp: FollowUpStatus.NONE,
    emailSent: false,
  },
  {
    id: '4',
    name: 'Michael Chen',
    email: 'm.chen@trucking-co.com',
    company: 'Rapid Trans',
    board: 'Board C',
    deviceType: 'Samsung Tab S7',
    appVersion: 'v4.2.1',
    eldStatus: ELDStatus.CONNECTED,
    dutyStatus: DutyStatus.SLEEPER,
    followUp: FollowUpStatus.NONE,
    emailSent: false,
  },
  {
    id: '5',
    name: 'Linda Thompson',
    email: 'l.thompson@trucking-co.com',
    company: 'Global Freight',
    board: 'Board B',
    deviceType: 'iPad Air',
    appVersion: 'v3.8.5',
    eldStatus: ELDStatus.DISCONNECTED,
    dutyStatus: DutyStatus.DRIVING,
    followUp: FollowUpStatus.ACTION_REQUIRED,
    emailSent: true,
    lastEmailTime: '2023-10-27T09:15:00Z',
  },
  {
    id: '6',
    name: 'Kevon Wright',
    email: 'k.wright@trucking-co.com',
    company: 'Alpha Logistics',
    board: 'Board C',
    deviceType: 'Lenovo Tab P11',
    appVersion: 'v4.0.0',
    eldStatus: ELDStatus.CONNECTED,
    dutyStatus: DutyStatus.ON_DUTY,
    followUp: FollowUpStatus.NONE,
    emailSent: false,
  }
];

export const APP_CONFIG = {
  GEMINI_MODEL: 'gemini-3-flash-preview',
  MAX_EMAIL_PER_DISCONNECT: 1,
};

// ROLE-BASED ACCESS CONTROL
// Maps specific user emails to a restricted Board ID.
// Users not in this list will default to 'ALL' (Admin access).
export const ROLE_MAPPING: Record<string, string> = {
  // Mock examples for RBAC multi-tenant system
  'boardA@leader-a1.com': 'Board A',
  'boardB@leader-a1.com': 'Board B',
  'boardC@leader-a1.com': 'Board C',
};
