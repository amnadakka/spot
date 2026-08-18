/**
 * Geofencing background task — registered at app startup (see root `index.ts`).
 *
 * Enter dedup: one notification per physical visit. Exit events reset the tracker;
 * a 30-minute cooldown catches GPS bounce while the user stays inside.
 *
 * Schedule windows are enforced before any alarm, history, or dedup record is written.
 * Enter while the window is closed arms an OS alarm for the next From time.
 * Metadata is hydrated from disk first so background/headless runs see the saved schedule.
 */
import type { LocationRegion } from 'expo-location';
import { GeofencingEventType } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { fireGeofenceAlarmImmediate } from '../notifications/showGeofenceEnterNotification';
import { armNextWindowOpenAfterTrigger, armWindowOpenAlarm, disarmWindowOpenAlarm } from '../notifications/windowOpenAlarm';
import { setCachedLanguage } from '../i18n/translations';
import { loadLanguage } from '../storage/preferences';
import {
  ensureGeofenceReminderMetadataHydrated,
  getGeofenceReminderMetadataSync,
} from '../storage/geofenceReminderTitles';
import {
  consumeDateUnlinkedRemindersAfterTrigger,
  shouldAutoDeleteAfterTrigger,
} from '../storage/consumeDateUnlinkedReminders';
import { persistPendingGeofenceAlarm } from '../storage/pendingGeofenceAlarm';
import { loadReminders } from '../storage/reminders';
import { isScheduleActiveNow } from '../utils/reminderSchedule';
import {
  clearEnterNotification,
  ensureEnterDedupHydrated,
  recordEnterNotification,
  shouldSuppressEnterNotification,
} from '../storage/geofenceEnterDedup';
import { registerVisitEnter } from '../storage/geofenceVisitBatch';
import { appendGeofenceEnterHistory } from '../storage/history';

export const GEOFENCING_TASK_NAME = 'REMINDER_GEOFENCING';

type GeofencingTaskEvent = {
  eventType: GeofencingEventType;
  region: LocationRegion;
};

TaskManager.defineTask<GeofencingTaskEvent>(GEOFENCING_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[Geofencing] Task error:', error.message);
    return;
  }

  if (!data) {
    return;
  }

  const { eventType, region } = data;
  const regionId = region.identifier;

  if (!regionId) {
    return;
  }

  if (eventType === GeofencingEventType.Exit) {
    clearEnterNotification(regionId);
    await disarmWindowOpenAlarm(regionId);
    return;
  }

  if (eventType !== GeofencingEventType.Enter) {
    return;
  }

  if (shouldSuppressEnterNotification(regionId)) {
    console.log('[Geofencing] Suppressed duplicate enter for', regionId);
    return;
  }

  await ensureEnterDedupHydrated();
  if (shouldSuppressEnterNotification(regionId)) {
    console.log('[Geofencing] Suppressed duplicate enter for', regionId, '(after hydrate)');
    return;
  }

  const language = await loadLanguage();
  setCachedLanguage(language);

  await ensureGeofenceReminderMetadataHydrated();

  const metadata = getGeofenceReminderMetadataSync(regionId);
  if (!metadata) {
    console.log('[Geofencing] No metadata for region; skipping enter', regionId);
    return;
  }

  if (!isScheduleActiveNow(metadata.schedule)) {
    console.log('[Geofencing] Schedule inactive for region; arming window-open alarm', regionId);
    await armWindowOpenAlarm(regionId, metadata.schedule);
    return;
  }

  const visit = registerVisitEnter(regionId);

  if (visit.shouldFireAlarm) {
    try {
      await fireGeofenceAlarmImmediate(visit.regionIds, visit.startedAt);
      await persistPendingGeofenceAlarm(visit.regionIds, visit.startedAt);
    } catch (e) {
      console.warn('[Geofencing] Alarm failed:', e);
    }
  }

  recordEnterNotification(regionId);

  try {
    await appendGeofenceEnterHistory({
      regionId,
      latitude: region.latitude,
      longitude: region.longitude,
      triggeredAt: new Date().toISOString(),
      spotTitle: metadata.title,
      address: metadata.address,
      description: metadata.description,
      radiusMeters: metadata.radiusMeters,
    });
  } catch (e) {
    console.warn('[Geofencing] History write failed:', e);
  }

  try {
    await consumeDateUnlinkedRemindersAfterTrigger([regionId]);
  } catch (e) {
    console.warn('[Geofencing] One-shot cleanup failed:', e);
  }

  try {
    const reminders = await loadReminders();
    const reminder = reminders.find((item) => item.id === regionId);
    if (reminder && !shouldAutoDeleteAfterTrigger(reminder.schedule)) {
      await armNextWindowOpenAfterTrigger(reminder);
    }
  } catch (e) {
    console.warn('[Geofencing] Next window arm failed:', e);
  }
});
