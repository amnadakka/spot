/**
 * Geofencing background task — registered at app startup (see root `index.ts`).
 *
 * CRITICAL DESIGN: The OS gives us a few seconds of background execution time.
 * Android Doze / iOS Suspended will kill the JS runtime if we take too long.
 * The notification MUST fire before any disk I/O. History logging is deferred
 * to a lightweight queue that drains when the app returns to the foreground.
 *
 * Enter dedup: one notification per physical visit. Exit events reset the tracker;
 * a 30-minute cooldown catches GPS bounce while the user stays inside.
 */
import type { LocationRegion } from 'expo-location';
import { GeofencingEventType } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { fireGeofenceNotificationImmediate } from '../notifications/showGeofenceEnterNotification';
import {
  clearEnterNotification,
  recordEnterNotification,
  shouldSuppressEnterNotification,
} from '../storage/geofenceEnterDedup';
import { enqueuePendingHistoryEvent } from '../storage/pendingHistory';

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

  // 2. Enqueue a minimal history stub for the foreground drain.
  try {
    enqueuePendingHistoryEvent({
      regionId,
      latitude: region.latitude,
      longitude: region.longitude,
      triggeredAt: new Date().toISOString(),
    });
  } catch {
    // Non-critical — history will be missing this entry but the notification fired.
  }
});
