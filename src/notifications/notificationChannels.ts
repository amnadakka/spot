import { Platform } from 'react-native';

import { GEOFENCE_NOTIFICATION_CHANNEL_ID } from './constants';

export async function ensureGeofenceAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  await Notifications.setNotificationChannelAsync(GEOFENCE_NOTIFICATION_CHANNEL_ID, {
    name: 'Location reminders',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 100, 250],
    sound: 'default',
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableLights: true,
    enableVibrate: true,
  });
}
