import { Platform } from 'react-native';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { fill, getT } from '../i18n/translations';
import { getGeofenceReminderMetadataSync } from '../storage/geofenceReminderTitles';

import { ensureGeofenceAlarmCategory } from './alarmCategory';
import {
  GEOFENCE_ALARM_CATEGORY_ID,
  GEOFENCE_ALARM_CHANNEL_ID,
  SPOT_ALARM_SOUND,
} from './constants';

export function buildGeofenceAlarmContent(
  regionIds: string[],
  batchStartedAt: number,
): {
  title: string;
  body: string;
  data: Record<string, unknown>;
} {
  const t = getT();
  let title: string;
  let body: string;

  if (regionIds.length === 1) {
    const metadata = getGeofenceReminderMetadataSync(regionIds[0]);
    title = metadata?.title ?? t.spotAlarm;
    body = metadata?.address ?? t.enteredSpotArea;
  } else {
    const titles = regionIds
      .map((id) => getGeofenceReminderMetadataSync(id)?.title ?? t.spotFallback)
      .slice(0, 3);
    const extra = regionIds.length - titles.length;
    const list =
      extra > 0
        ? fill(t.nearbySpotsMore, { list: titles.join(', '), extra })
        : titles.join(', ');
    title = fill(t.nearbySpotsNotificationTitle, { count: regionIds.length });
    body = list;
  }

  return {
    title,
    body,
    data: {
      type: 'geofence_enter',
      regionId: regionIds[0],
      regionIds,
      batchStartedAt,
      eyebrow: t.spotAlarmEyebrow,
      dismissLabel: t.dismiss,
      viewSpotLabel: t.viewSpot,
    },
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

  const { disarmWindowOpenAlarms } = await import('./windowOpenAlarm');
  await disarmWindowOpenAlarms(regionIds);

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  await ensureGeofenceAlarmCategory();
  const { title, body, data } = buildGeofenceAlarmContent(regionIds, batchStartedAt);

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: SPOT_ALARM_SOUND,
      priority: Notifications.AndroidNotificationPriority.MAX,
      sticky: true,
      autoDismiss: false,
      vibrate: [0, 500, 200, 500, 200, 500],
      ...(Platform.OS === 'ios'
        ? {
            interruptionLevel: 'timeSensitive' as const,
            categoryIdentifier: GEOFENCE_ALARM_CATEGORY_ID,
          }
        : {}),
      data,
    },
    trigger:
      Platform.OS === 'android'
        ? { channelId: GEOFENCE_ALARM_CHANNEL_ID }
        : null,
  });
}

/** @deprecated Use fireGeofenceAlarmImmediate. */
export const fireGeofenceNotificationImmediate = fireGeofenceAlarmImmediate;
