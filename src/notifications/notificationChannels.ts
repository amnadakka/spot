import { Platform } from 'react-native';

import { GEOFENCE_ALARM_CHANNEL_ID, SPOT_ALARM_SOUND } from './constants';

export async function ensureGeofenceAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');

  await Notifications.setNotificationChannelAsync(GEOFENCE_ALARM_CHANNEL_ID, {
    name: 'Spot alarms',
    description: 'Ringtone-style reminders when you enter a saved spot area.',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 500, 200, 500, 200, 500],
    sound: SPOT_ALARM_SOUND,
    bypassDnd: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    enableLights: true,
    enableVibrate: true,
    audioAttributes: {
      usage: Notifications.AndroidAudioUsage.ALARM,
      contentType: Notifications.AndroidAudioContentType.SONIFICATION,
    },
  });
}
