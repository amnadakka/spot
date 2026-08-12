import { DeviceEventEmitter } from 'react-native';

import { syncReminderGeofencing } from '../services/syncReminderGeofencing';
import { getScheduleDateMode } from '../utils/reminderSchedule';
import type { ReminderSchedule } from '../types/reminder';

import { loadReminders, saveReminders } from './reminders';

/** Fired after reminders are changed outside React state (e.g. background geofence). */
export const REMINDERS_CHANGED_EVENT = 'spot_reminders_changed';

/**
 * One-shot spots: One day (specific date) or Once (any day, fire once).
 * Recurring Every day / Custom are kept after trigger.
 * Legacy schedules with no date mode are treated as Once.
 */
export function shouldAutoDeleteAfterTrigger(schedule?: ReminderSchedule): boolean {
  const mode = getScheduleDateMode(schedule);
  return mode === 'once' || mode === 'oneshot' || mode === 'none';
}

/**
 * After a geofence trigger, delete matching one-shot reminders, sync native
 * regions, and notify the UI to reload.
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
      return Boolean(reminder && shouldAutoDeleteAfterTrigger(reminder.schedule));
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
