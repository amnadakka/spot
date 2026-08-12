export type ScheduleDateMode = 'once' | 'oneshot' | 'daily' | 'weekly';

export type ReminderSchedule = {
  /** One-time local calendar date in YYYY-MM-DD format. */
  date?: string;
  /**
   * `daily` — every day (recurring).
   * `once` — fire on any day, then auto-delete after trigger (no calendar date).
   * Mutually exclusive with `date` and `weekdays`.
   */
  repeat?: 'daily' | 'once';
  /** Local weekdays when active — 0 = Sunday … 6 = Saturday (mutually exclusive with `date` and `repeat`). */
  weekdays?: number[];
  /** Local time in HH:mm — start of the active window when geofence alarms may fire. */
  timeStart?: string;
  /** Local time in HH:mm — end of the active window (optional). */
  timeEnd?: string;
};

export type Reminder = {
  id: string;
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  /** Distance from the point at which the reminder applies, in meters. */
  radiusMeters: number;
  enabled: boolean;
  createdAt: string;
  /** Optional date/time window for geofence reminders. */
  schedule?: ReminderSchedule;
};

export const REMINDER_RADIUS_OPTIONS = [100, 150, 200] as const;

export type ReminderRadiusMeters = (typeof REMINDER_RADIUS_OPTIONS)[number];

export const DEFAULT_REMINDER_RADIUS_METERS: ReminderRadiusMeters = 200;

export const MAX_DESCRIPTION_LENGTH = 100;

/** Cap on simultaneously enabled geofence regions to protect background battery. */
export const MAX_ACTIVE_SPOTS = 5;
