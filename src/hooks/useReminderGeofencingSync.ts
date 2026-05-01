import { useEffect } from 'react';

import { syncReminderGeofencing } from '../services/syncReminderGeofencing';
import type { Reminder } from '../types/reminder';

/** Keeps native geofencing regions in sync with in-memory reminders. */
export function useReminderGeofencingSync(reminders: Reminder[]) {
  useEffect(() => {
    syncReminderGeofencing(reminders).catch((err) => {
      console.warn('[Geofencing] Failed to sync regions:', err);
    });
  }, [reminders]);
}
