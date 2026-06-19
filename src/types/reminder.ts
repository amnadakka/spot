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
};

export const REMINDER_RADIUS_OPTIONS = [50, 100, 150, 200] as const;

export type ReminderRadiusMeters = (typeof REMINDER_RADIUS_OPTIONS)[number];

export const DEFAULT_REMINDER_RADIUS_METERS: ReminderRadiusMeters = 200;

export const MAX_DESCRIPTION_LENGTH = 100;

/** Cap on simultaneously enabled geofence regions to protect background battery. */
export const MAX_ACTIVE_SPOTS = 5;

export const MAX_ACTIVE_SPOTS_MESSAGE =
  'Maximum of 5 active spots allowed to optimize background battery performance.';
