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

import { fireGeofenceNotificationImmediate } from '../notifications/showGeofenceEnterNotification';
import { getGeofenceReminderMetadataSync } from '../storage/geofenceReminderTitles';
import {
  clearEnterNotification,
  recordEnterNotification,
  shouldSuppressEnterNotification,
} from '../storage/geofenceEnterDedup';
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

  // 1. Fire notification IMMEDIATELY, then mark this visit as notified.
  try {
    await fireGeofenceNotificationImmediate(regionId);
    recordEnterNotification(regionId);
  } catch (e) {
    console.warn('[Geofencing] Notification failed:', e);
  }

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
    });
  } catch (e) {
    console.warn('[Geofencing] History write failed:', e);
  }
});
