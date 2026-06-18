/**
 * Geofencing background task — registered at app startup (see root `index.ts`).
 *
 * CRITICAL DESIGN: The OS gives us a few seconds of background execution time.
 * Android Doze / iOS Suspended will kill the JS runtime if we take too long.
 * The notification MUST fire before any disk I/O. History is written directly
 * afterward (one read + one write) using in-memory metadata — no reminder-list
 * loads that could blow the background time budget.
 *
 * Enter dedup: one notification per physical visit. Exit events reset the tracker;
 * a 30-minute cooldown catches GPS bounce while the user stays inside.
 */
import type { LocationRegion } from 'expo-location';
import { GeofencingEventType } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { fireGeofenceAlarmImmediate } from '../notifications/showGeofenceEnterNotification';
import { getGeofenceReminderMetadataSync } from '../storage/geofenceReminderTitles';
import { persistPendingGeofenceAlarm } from '../storage/pendingGeofenceAlarm';
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
    return;
  }

  if (eventType !== GeofencingEventType.Enter) {
    return;
  }

  // Fast in-memory dedup — no async I/O before this check.
  if (shouldSuppressEnterNotification(regionId)) {
    console.log('[Geofencing] Suppressed duplicate enter for', regionId);
    return;
  }

  // After a cold JS start the in-memory cache is empty; hydrate before proceeding.
  await ensureEnterDedupHydrated();
  if (shouldSuppressEnterNotification(regionId)) {
    console.log('[Geofencing] Suppressed duplicate enter for', regionId, '(after hydrate)');
    return;
  }

  // 1. Group overlapping enters into one alarm per visit, then notify if needed.
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

  // 2. Persist history — awaited so the write finishes before the task exits.
  // Labels come from the in-memory metadata cache (zero disk reads on this step).
  try {
    const metadata = getGeofenceReminderMetadataSync(regionId);
    await appendGeofenceEnterHistory({
      regionId,
      latitude: region.latitude,
      longitude: region.longitude,
      triggeredAt: new Date().toISOString(),
      spotTitle: metadata?.title,
      address: metadata?.address,
      description: metadata?.description,
    });
  } catch (e) {
    console.warn('[Geofencing] History write failed:', e);
  }
});
