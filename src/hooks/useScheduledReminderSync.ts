import { useEffect, useRef } from 'react';

import { syncAllScheduledReminderNotifications } from '../services/scheduledReminderNotifications';
import type { Reminder } from '../types/reminder';

export type ScheduledNotificationIdUpdate = {
  id: string;
  scheduledNotificationId: string | undefined;
};

type UseScheduledReminderSyncOptions = {
  onNotificationIdsUpdated?: (updates: ScheduledNotificationIdUpdate[]) => void;
};

/** Keeps time-based reminder notifications aligned with in-memory reminders. */
export function useScheduledReminderSync(
  reminders: Reminder[],
  { onNotificationIdsUpdated }: UseScheduledReminderSyncOptions = {},
) {
  const syncGenerationRef = useRef(0);

  useEffect(() => {
    const generation = ++syncGenerationRef.current;
    const snapshot = reminders;

    void syncAllScheduledReminderNotifications(snapshot)
      .then((synced) => {
        if (generation !== syncGenerationRef.current) {
          return;
        }

        const snapshotIds = new Set(snapshot.map((reminder) => reminder.id));
        const updates: ScheduledNotificationIdUpdate[] = synced
          .filter((reminder) => snapshotIds.has(reminder.id))
          .map((reminder) => ({
            id: reminder.id,
            scheduledNotificationId: reminder.scheduledNotificationId,
          }));

        const changed = updates.some((update) => {
          const original = snapshot.find((reminder) => reminder.id === update.id);
          return original?.scheduledNotificationId !== update.scheduledNotificationId;
        });

        if (changed) {
          onNotificationIdsUpdated?.(updates);
        }
      })
      .catch((error) => {
        console.warn('[ScheduledReminder] Failed to sync notifications:', error);
      });
  }, [reminders, onNotificationIdsUpdated]);
}
