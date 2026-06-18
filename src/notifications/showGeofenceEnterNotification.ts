import { Platform } from 'react-native';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { getGeofenceReminderMetadataSync } from '../storage/geofenceReminderTitles';

import { GEOFENCE_ALARM_CHANNEL_ID, SPOT_ALARM_SOUND } from './constants';

function buildAlarmContent(regionIds: string[], batchStartedAt: number): {
  title: string;
  body: string;
} {
  if (regionIds.length === 1) {
    const metadata = getGeofenceReminderMetadataSync(regionIds[0]);
    return {
      title: metadata?.title ?? 'Spot Alarm',
      body: metadata?.address ?? 'You entered a saved spot area.',
    };
  }

  const titles = regionIds
    .map((id) => getGeofenceReminderMetadataSync(id)?.title ?? 'Spot')
    .slice(0, 3);
  const extra = regionIds.length - titles.length;
  const list = extra > 0 ? `${titles.join(', ')} +${extra} more` : titles.join(', ');

  return {
    title: `${regionIds.length} nearby spots`,
    body: list,
  };
}

/**
 * Fires an alarm-style reminder immediately — custom ringtone on the OS channel,
 * max priority, sticky until dismissed. Uses in-memory metadata only (no disk I/O).
 */
export async function fireGeofenceAlarmImmediate(
  regionIds: string[],
  batchStartedAt: number,
): Promise<void> {
  if (isExpoGoAndroid() || regionIds.length === 0) {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  const primaryRegionId = regionIds[0];
  const { title, body } = buildAlarmContent(regionIds, batchStartedAt);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: SPOT_ALARM_SOUND,
      priority: Notifications.AndroidNotificationPriority.MAX,
      sticky: true,
      autoDismiss: false,
      vibrate: [0, 500, 200, 500, 200, 500],
      ...(Platform.OS === 'ios' ? { interruptionLevel: 'timeSensitive' as const } : {}),
      data: {
        type: 'geofence_enter',
        regionId: primaryRegionId,
        regionIds,
        batchStartedAt,
      },
    },
    trigger:
      Platform.OS === 'android'
        ? { channelId: GEOFENCE_ALARM_CHANNEL_ID }
        : null,
  });
}

/** @deprecated Use fireGeofenceAlarmImmediate. */
export const fireGeofenceNotificationImmediate = fireGeofenceAlarmImmediate;
