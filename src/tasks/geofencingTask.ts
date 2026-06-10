/**
 * Geofencing background task — registered at app startup (see root `index.ts`).
 *
 * CRITICAL DESIGN: The OS gives us a few seconds of background execution time.
 * Android Doze / iOS Suspended will kill the JS runtime if we take too long.
 * The notification MUST fire before any disk I/O. History logging is deferred
 * to a lightweight queue that drains when the app returns to the foreground.
 */
import type { LocationRegion } from 'expo-location';
import { GeofencingEventType } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { fireGeofenceNotificationImmediate } from '../notifications/showGeofenceEnterNotification';
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

  if (eventType !== GeofencingEventType.Enter) {
    return;
  }

  const regionId = region.identifier;

  // 1. Fire notification IMMEDIATELY — zero disk reads before this call.
  //    The notification content embeds the region identifier in `data` so the
  //    foreground listener can reconcile history even if the title was generic.
  try {
    await fireGeofenceNotificationImmediate(regionId);
  } catch (e) {
    console.warn('[Geofencing] Notification failed:', e);
  }

  // 2. Enqueue a minimal history stub for the foreground drain.
  //    This is a single small AsyncStorage write (~100 bytes), not a read-modify-write.
  try {
    enqueuePendingHistoryEvent({
      regionId: regionId ?? 'unknown',
      latitude: region.latitude,
      longitude: region.longitude,
      triggeredAt: new Date().toISOString(),
    });
  } catch {
    // Non-critical — history will be missing this entry but the notification fired.
  }
});
