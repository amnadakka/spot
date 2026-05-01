import { Platform } from 'react-native';

import { GEOFENCE_NOTIFICATION_CHANNEL_ID } from './constants';

export async function ensureGeofenceAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  await Notifications.setNotificationChannelAsync(GEOFENCE_NOTIFICATION_CHANNEL_ID, {
    name: 'Location reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250],
    sound: 'default',
  });
}
