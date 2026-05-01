import { Platform } from 'react-native';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { loadGeofenceReminderTitles } from '../storage/geofenceReminderTitles';

import { GEOFENCE_NOTIFICATION_CHANNEL_ID } from './constants';
import { ensureGeofenceAndroidChannel } from './notificationChannels';

/**
 * Posts an immediate local notification (safe to call from the geofencing TaskManager task).
 */
export async function showGeofenceEnterNotification(regionIdentifier: string | undefined): Promise<void> {
  if (isExpoGoAndroid()) {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  const titles = await loadGeofenceReminderTitles();
  const reminderTitle =
    regionIdentifier && titles[regionIdentifier] ? titles[regionIdentifier] : 'Reminder';

  const notifyPerm = await Notifications.getPermissionsAsync();
  if (!notifyPerm.granted) {
    console.warn('[Geofencing] Notifications permission not granted; cannot show alert.');
    return;
  }

  await ensureGeofenceAndroidChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: reminderTitle,
      body: 'You entered this reminder area.',
      sound: true,
    },
    trigger:
      Platform.OS === 'android'
        ? { channelId: GEOFENCE_NOTIFICATION_CHANNEL_ID }
        : null,
  });
}
