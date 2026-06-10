import { Platform } from 'react-native';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';

import { GEOFENCE_NOTIFICATION_CHANNEL_ID } from './constants';

/**
 * Posts an immediate local notification with ZERO disk reads in the critical path.
 *
 * Previous implementation read AsyncStorage to resolve the reminder title before
 * calling scheduleNotificationAsync. Under Doze/Suspended, that extra I/O often
 * caused the OS to kill the JS runtime before the notification could fire.
 *
 * Now: fire a generic notification instantly, embed the regionId in `data` so
 * the foreground can enrich the history entry later.
 *
 * The Android channel is created once at app launch (setupNotificationsForAppLaunch),
 * so we skip ensureGeofenceAndroidChannel here to save another async hop.
 */
export async function fireGeofenceNotificationImmediate(
  regionIdentifier: string | undefined,
): Promise<void> {
  if (isExpoGoAndroid()) {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  // Skip permission check — getPermissionsAsync is another async hop.
  // If permissions weren't granted, scheduleNotificationAsync will simply no-op on
  // Android and throw on iOS (caught by the task's try/catch).

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Spot Reminder',
      body: 'You entered a saved spot area.',
      sound: true,
      data: { regionId: regionIdentifier ?? 'unknown', type: 'geofence_enter' },
    },
    trigger:
      Platform.OS === 'android'
        ? { channelId: GEOFENCE_NOTIFICATION_CHANNEL_ID }
        : null,
  });
}
