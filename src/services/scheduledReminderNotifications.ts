import { Platform } from 'react-native';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { GEOFENCE_ALARM_CHANNEL_ID, SPOT_ALARM_SOUND } from '../notifications/constants';
import type { Reminder } from '../types/reminder';
import { computeScheduledNotificationDate, normalizeSchedule } from '../utils/reminderSchedule';

export async function cancelScheduledReminderNotification(
  notificationId?: string,
): Promise<void> {
  if (isExpoGoAndroid() || !notificationId) {
    return;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

export async function syncScheduledReminderNotification(
  reminder: Reminder,
): Promise<string | undefined> {
  if (isExpoGoAndroid()) {
    return undefined;
  }

  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  const schedule = normalizeSchedule(reminder.schedule);
  const triggerDate = computeScheduledNotificationDate(schedule);

  if (reminder.scheduledNotificationId) {
    await cancelScheduledReminderNotification(reminder.scheduledNotificationId);
  }

  if (!reminder.enabled || !triggerDate) {
    return undefined;
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: reminder.title,
      body: reminder.description?.trim() || reminder.address,
      sound: SPOT_ALARM_SOUND,
      priority: Notifications.AndroidNotificationPriority.MAX,
      data: {
        type: 'scheduled_reminder',
        regionId: reminder.id,
        regionIds: [reminder.id],
      },
      ...(Platform.OS === 'ios' ? { interruptionLevel: 'timeSensitive' as const } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      ...(Platform.OS === 'android' ? { channelId: GEOFENCE_ALARM_CHANNEL_ID } : {}),
    },
  });

  return notificationId;
}

export async function syncAllScheduledReminderNotifications(
  reminders: Reminder[],
): Promise<Reminder[]> {
  if (isExpoGoAndroid()) {
    return reminders;
  }

  const nextReminders = await Promise.all(
    reminders.map(async (reminder) => {
      const scheduledNotificationId = await syncScheduledReminderNotification(reminder);
      if (scheduledNotificationId === reminder.scheduledNotificationId) {
        return reminder;
      }

      return {
        ...reminder,
        scheduledNotificationId,
      };
    }),
  );

  return nextReminders;
}
