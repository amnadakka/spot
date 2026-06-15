import { Platform } from 'react-native';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { getGeofenceReminderMetadataSync } from '../storage/geofenceReminderTitles';

import { GEOFENCE_ALARM_CHANNEL_ID, SPOT_ALARM_SOUND } from './constants';

/**
 * Fires an alarm-style reminder immediately — custom ringtone on the OS channel,
 * max priority, sticky until dismissed. Uses in-memory metadata only (no disk I/O).
 */
export async function fireGeofenceAlarmImmediate(
  regionIdentifier: string | undefined,
): Promise<void> {
  if (isExpoGoAndroid()) {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  const regionId = regionIdentifier ?? 'unknown';
  const metadata = getGeofenceReminderMetadataSync(regionId);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: metadata?.title ?? 'Spot Alarm',
      body: metadata?.address ?? 'You entered a saved spot area.',
      sound: SPOT_ALARM_SOUND,
      priority: Notifications.AndroidNotificationPriority.MAX,
      sticky: true,
      autoDismiss: false,
      vibrate: [0, 500, 200, 500, 200, 500],
      data: { regionId, type: 'geofence_enter' },
    },
    trigger:
      Platform.OS === 'android'
        ? { channelId: GEOFENCE_ALARM_CHANNEL_ID }
        : null,
  });
}

/** @deprecated Use fireGeofenceAlarmImmediate. */
export const fireGeofenceNotificationImmediate = fireGeofenceAlarmImmediate;
