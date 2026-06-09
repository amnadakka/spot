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

export const DEFAULT_REMINDER_RADIUS_METERS = 100;

export const MAX_DESCRIPTION_LENGTH = 100;
