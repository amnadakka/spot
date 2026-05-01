export type Reminder = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  /** Distance from the point at which the reminder applies, in meters. */
  radiusMeters: number;
};

export const DEFAULT_REMINDER_RADIUS_METERS = 100;
