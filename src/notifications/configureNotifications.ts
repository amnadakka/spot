import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';

import { ensureGeofenceAlarmCategory } from './alarmCategory';
import { ensureGeofenceAndroidChannel } from './notificationChannels';

/**
 * Foreground presentation when `expo-notifications` is loaded (skipped on Expo Go Android).
 */
if (!isExpoGoAndroid()) {
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data;
      const isGeofenceAlarm =
        data?.type === 'geofence_enter' && typeof data.regionId === 'string';

      return {
        shouldShowBanner: true,
        shouldShowList: true,
        // Foreground geofence alarms use looping in-app playback instead.
        shouldPlaySound: !isGeofenceAlarm,
        shouldSetBadge: false,
      };
    },
  });
}

export async function requestNotificationPermissionsAsync(): Promise<boolean> {
  if (isExpoGoAndroid()) {
    return false;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Ensures the Android notification channel exists (no permission prompt). */
export async function ensureNotificationsReady(): Promise<void> {
  if (isExpoGoAndroid()) {
    return;
  }

  await Promise.all([ensureGeofenceAndroidChannel(), ensureGeofenceAlarmCategory()]);
}

/** Call once when the UI mounts: Android channel + OS notification permission prompt. */
export async function setupNotificationsForAppLaunch(): Promise<void> {
  await ensureNotificationsReady();
  await requestNotificationPermissionsAsync();
}
