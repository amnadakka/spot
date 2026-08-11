import { DeviceEventEmitter } from 'react-native';

import { syncReminderGeofencing } from '../services/syncReminderGeofencing';
import { hasScheduleDateRestriction } from '../utils/reminderSchedule';

import { loadReminders, saveReminders } from './reminders';

/** Fired after reminders are changed outside React state (e.g. background geofence). */
export const REMINDERS_CHANGED_EVENT = 'spot_reminders_changed';

/**
 * Spots with no date / daily / weekly rule fire once, then are removed.
 * Time-only windows still count as date-unlinked.
 */
export function isDateUnlinkedReminder(schedule: Parameters<typeof hasScheduleDateRestriction>[0]): boolean {
  return !hasScheduleDateRestriction(schedule);
}

/**
 * After a geofence trigger, delete matching reminders that are not linked to a date
 * rule, sync native regions, and notify the UI to reload.
 */
export async function consumeDateUnlinkedRemindersAfterTrigger(
  regionIds: string[],
): Promise<string[]> {
  if (regionIds.length === 0) {
    return [];
  }

  const reminders = await loadReminders();
  const toDelete = new Set(
    regionIds.filter((id) => {
      const reminder = reminders.find((item) => item.id === id);
      return Boolean(reminder && isDateUnlinkedReminder(reminder.schedule));
    }),
  );

  if (toDelete.size === 0) {
    return [];
  }

  const next = reminders.filter((reminder) => !toDelete.has(reminder.id));
  await saveReminders(next);
  await syncReminderGeofencing(next);
  DeviceEventEmitter.emit(REMINDERS_CHANGED_EVENT);

  return [...toDelete];
}
