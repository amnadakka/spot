import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import type { Reminder } from '../types/reminder';

type StoredReminder = Reminder & { scheduledNotificationId?: string };

/** Cancels OS time-only notifications from older app versions and strips stored ids. */
export async function cancelLegacyScheduledNotifications(
  reminders: StoredReminder[],
): Promise<Reminder[]> {
  if (isExpoGoAndroid()) {
    return reminders.map(stripLegacyScheduledNotificationId);
  }

  const legacyIds = reminders
    .map((reminder) => reminder.scheduledNotificationId)
    .filter((id): id is string => Boolean(id));

  if (legacyIds.length > 0) {
    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    await Promise.all(
      legacyIds.map((id) =>
        Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
      ),
    );
  }

  return reminders.map(stripLegacyScheduledNotificationId);
}

function stripLegacyScheduledNotificationId(reminder: StoredReminder): Reminder {
  const { scheduledNotificationId: _, ...next } = reminder;
  return next;
}
