/** Android channel for spot geofence alarms (custom ringtone, max priority). */
export const GEOFENCE_ALARM_CHANNEL_ID = 'geofence-spot-alarms';

/** Bundled alarm sound — referenced by base filename in expo-notifications. */
export const SPOT_ALARM_SOUND = 'alarm.mp3';

/** @deprecated Use GEOFENCE_ALARM_CHANNEL_ID. Kept for migration from older builds. */
export const GEOFENCE_NOTIFICATION_CHANNEL_ID = GEOFENCE_ALARM_CHANNEL_ID;
