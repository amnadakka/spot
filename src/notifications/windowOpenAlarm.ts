import { Platform } from 'react-native';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import {
  cancelWindowOpen,
  cancelWindowOpenExcept,
  isSpotAlarmNativeAvailable,
  scheduleWindowOpen,
} from '../services/spotAlarmNative';
import type { Reminder, ReminderSchedule } from '../types/reminder';
import { isScheduleActiveNow, nextWindowStartAt } from '../utils/reminderSchedule';

import { ensureGeofenceAlarmCategory } from './alarmCategory';
import {
  GEOFENCE_ALARM_CATEGORY_ID,
  GEOFENCE_ALARM_CHANNEL_ID,
  SPOT_ALARM_SOUND,
} from './constants';
import { buildGeofenceAlarmContent } from './showGeofenceEnterNotification';

export const WINDOW_OPEN_NOTIFICATION_PREFIX = 'spot-window-open:';

export function windowOpenNotificationId(regionId: string): string {
  return `${WINDOW_OPEN_NOTIFICATION_PREFIX}${regionId}`;
}

function shouldSkip(): boolean {
  return isExpoGoAndroid() || Platform.OS === 'web';
}

async function cancelExpoWindowOpen(regionId: string): Promise<void> {
  if (shouldSkip()) {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  await Notifications.cancelScheduledNotificationAsync(windowOpenNotificationId(regionId)).catch(
    () => undefined,
  );
}

async function cancelExpoWindowOpenExcept(keepIds: Set<string>): Promise<void> {
  if (shouldSkip()) {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const keep = new Set([...keepIds].map(windowOpenNotificationId));

  await Promise.all(
    scheduled
      .filter((item) => {
        const id = item.identifier;
        return id.startsWith(WINDOW_OPEN_NOTIFICATION_PREFIX) && !keep.has(id);
      })
      .map((item) =>
        Notifications.cancelScheduledNotificationAsync(item.identifier).catch(() => undefined),
      ),
  );
}

async function scheduleExpoWindowOpen(
  regionId: string,
  fireAt: Date,
  title: string,
  body: string,
  data: Record<string, unknown>,
): Promise<void> {
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  await ensureGeofenceAlarmCategory();

  await Notifications.scheduleNotificationAsync({
    identifier: windowOpenNotificationId(regionId),
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
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireAt,
      ...(Platform.OS === 'android' ? { channelId: GEOFENCE_ALARM_CHANNEL_ID } : {}),
    },
  });
}

/** Cancel a pending window-open alarm for one or more spots. */
export async function disarmWindowOpenAlarms(regionIds: string[]): Promise<void> {
  if (shouldSkip() || regionIds.length === 0) {
    return;
  }

  await Promise.all(
    regionIds.map(async (regionId) => {
      if (Platform.OS === 'android' && isSpotAlarmNativeAvailable()) {
        cancelWindowOpen(regionId);
      }
      await cancelExpoWindowOpen(regionId);
    }),
  );
}

export async function disarmWindowOpenAlarm(regionId: string): Promise<void> {
  await disarmWindowOpenAlarms([regionId]);
}

/**
 * Arm an OS alarm for the next `timeStart` while the user is already inside.
 * Android uses exact AlarmManager; iOS uses a dated local notification.
 */
export async function armWindowOpenAlarm(
  regionId: string,
  schedule: ReminderSchedule | undefined,
  now = new Date(),
): Promise<void> {
  if (shouldSkip()) {
    return;
  }

  const fireAt = nextWindowStartAt(schedule, now);
  if (!fireAt) {
    await disarmWindowOpenAlarm(regionId);
    return;
  }

  const batchStartedAt = fireAt.getTime();
  const { title, body, data } = buildGeofenceAlarmContent([regionId], batchStartedAt);

  if (Platform.OS === 'android' && isSpotAlarmNativeAvailable()) {
    const scheduledExact = scheduleWindowOpen(
      regionId,
      batchStartedAt,
      title,
      body,
      JSON.stringify(data),
    );
    await cancelExpoWindowOpen(regionId);
    if (scheduledExact) {
      return;
    }
  }

  try {
    await scheduleExpoWindowOpen(regionId, fireAt, title, body, data);
  } catch (error) {
    console.warn('[WindowOpen] Failed to schedule alarm for', regionId, error);
  }
}

function armReferenceTime(schedule: ReminderSchedule | undefined, now: Date): Date {
  if (isScheduleActiveNow(schedule, now)) {
    return new Date(now.getTime() + 60_000);
  }

  return now;
}

/**
 * Keep OS window-open alarms aligned with who is currently inside.
 * `insideIds` omitted means location is unknown — keep alarms for still-enabled spots.
 */
export async function syncWindowOpenAlarms(
  reminders: Reminder[],
  insideIds?: Set<string>,
  now = new Date(),
): Promise<void> {
  if (shouldSkip()) {
    return;
  }

  if (!insideIds) {
    const keepEnabled = new Set(
      reminders.filter((reminder) => reminder.enabled).map((reminder) => reminder.id),
    );
    if (Platform.OS === 'android' && isSpotAlarmNativeAvailable()) {
      cancelWindowOpenExcept([...keepEnabled]);
    }
    await cancelExpoWindowOpenExcept(keepEnabled);
    return;
  }

  const shouldArm = reminders.filter((reminder) => {
    if (!reminder.enabled || !insideIds.has(reminder.id)) {
      return false;
    }

    return Boolean(nextWindowStartAt(reminder.schedule, armReferenceTime(reminder.schedule, now)));
  });
  const shouldArmIds = new Set(shouldArm.map((reminder) => reminder.id));

  if (Platform.OS === 'android' && isSpotAlarmNativeAvailable()) {
    cancelWindowOpenExcept([...shouldArmIds]);
  }
  await cancelExpoWindowOpenExcept(shouldArmIds);

  await Promise.all(
    shouldArm.map((reminder) =>
      armWindowOpenAlarm(reminder.id, reminder.schedule, armReferenceTime(reminder.schedule, now)),
    ),
  );
}

/** After a recurring alarm fires, arm the following window in case the user stays inside. */
export async function armNextWindowOpenAfterTrigger(
  reminder: Reminder,
  triggeredAt = new Date(),
): Promise<void> {
  const nextFrom = new Date(triggeredAt.getTime() + 60_000);
  if (!nextWindowStartAt(reminder.schedule, nextFrom)) {
    return;
  }

  await armWindowOpenAlarm(reminder.id, reminder.schedule, nextFrom);
}
