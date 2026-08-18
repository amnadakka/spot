import { consumeDateUnlinkedRemindersAfterTrigger, shouldAutoDeleteAfterTrigger } from '../storage/consumeDateUnlinkedReminders';
import {
  ensureEnterDedupHydrated,
  recordEnterNotification,
} from '../storage/geofenceEnterDedup';
import {
  ensureGeofenceReminderMetadataHydrated,
  getGeofenceReminderMetadataSync,
} from '../storage/geofenceReminderTitles';
import { appendGeofenceEnterHistory } from '../storage/history';
import { persistPendingGeofenceAlarm } from '../storage/pendingGeofenceAlarm';
import { loadReminders } from '../storage/reminders';

import { armNextWindowOpenAfterTrigger } from './windowOpenAlarm';

const completedKeys = new Set<string>();

function deliveryKey(regionIds: string[], startedAt: number): string {
  return `${[...regionIds].sort().join('|')}:${startedAt}`;
}

/**
 * Side effects after an alarm is delivered by the OS (window-open or geofence
 * notification) so history, one-shot cleanup, and the next recurring window
 * still run when JS was not in the original trigger path.
 */
export async function completeGeofenceAlarmDelivery(
  regionIds: string[],
  startedAt: number,
): Promise<void> {
  if (regionIds.length === 0) {
    return;
  }

  const key = deliveryKey(regionIds, startedAt);
  if (completedKeys.has(key)) {
    return;
  }
  completedKeys.add(key);

  await persistPendingGeofenceAlarm(regionIds, startedAt);
  await ensureEnterDedupHydrated();
  await ensureGeofenceReminderMetadataHydrated();

  const triggeredAt = new Date(startedAt).toISOString();

  for (const regionId of regionIds) {
    recordEnterNotification(regionId);

    const metadata = getGeofenceReminderMetadataSync(regionId);
    try {
      await appendGeofenceEnterHistory({
        regionId,
        latitude: metadata?.latitude ?? 0,
        longitude: metadata?.longitude ?? 0,
        triggeredAt,
        spotTitle: metadata?.title,
        address: metadata?.address,
        description: metadata?.description,
        radiusMeters: metadata?.radiusMeters,
      });
    } catch (error) {
      console.warn('[GeofenceAlarm] History write failed:', error);
    }
  }

  try {
    await consumeDateUnlinkedRemindersAfterTrigger(regionIds);
  } catch (error) {
    console.warn('[GeofenceAlarm] One-shot cleanup failed:', error);
  }

  try {
    const reminders = await loadReminders();
    const triggeredAtDate = new Date(startedAt);
    for (const regionId of regionIds) {
      const reminder = reminders.find((item) => item.id === regionId);
      if (!reminder || shouldAutoDeleteAfterTrigger(reminder.schedule)) {
        continue;
      }
      await armNextWindowOpenAfterTrigger(reminder, triggeredAtDate);
    }
  } catch (error) {
    console.warn('[GeofenceAlarm] Next window arm failed:', error);
  }
}
