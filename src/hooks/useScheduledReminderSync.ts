import { useEffect, useRef } from 'react';

import { syncAllScheduledReminderNotifications } from '../services/scheduledReminderNotifications';
import type { Reminder } from '../types/reminder';

type UseScheduledReminderSyncOptions = {
  onRemindersUpdated?: (reminders: Reminder[]) => void;
};

/** Keeps time-based reminder notifications aligned with in-memory reminders. */
export function useScheduledReminderSync(
  reminders: Reminder[],
  { onRemindersUpdated }: UseScheduledReminderSyncOptions = {},
) {
  const syncingRef = useRef(false);

  useEffect(() => {
    if (syncingRef.current) {
      return;
    }

    syncingRef.current = true;
    void syncAllScheduledReminderNotifications(reminders)
      .then((nextReminders) => {
        const changed = nextReminders.some((reminder, index) => {
          return reminder.scheduledNotificationId !== reminders[index]?.scheduledNotificationId;
        });

        if (changed) {
          onRemindersUpdated?.(nextReminders);
        }
      })
      .catch((error) => {
        console.warn('[ScheduledReminder] Failed to sync notifications:', error);
      })
      .finally(() => {
        syncingRef.current = false;
      });
  }, [reminders, onRemindersUpdated]);
}
