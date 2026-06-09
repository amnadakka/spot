/**
 * Geofencing background task — registered at app startup (see root `index.ts`).
 *
 * When iOS/Android detect an enter/exit on a monitored circular region, the OS may launch or wake
 * your app’s JS runtime. Expo TaskManager runs this callback **outside React** (no mounted tree).
 * That is why `TaskManager.defineTask` must live at module scope, not inside a component.
 */
import type { LocationRegion } from 'expo-location';
import { GeofencingEventType } from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { showGeofenceEnterNotification } from '../notifications/showGeofenceEnterNotification';
import { appendHistoryEvent } from '../storage/history';
import { loadGeofenceReminderMetadata } from '../storage/geofenceReminderTitles';

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

  if (eventType === GeofencingEventType.Enter) {
    console.log('[Geofencing] Entered region', {
      identifier: region.identifier,
      latitude: region.latitude,
      longitude: region.longitude,
      radiusMeters: region.radius,
    });

    try {
      await showGeofenceEnterNotification(region.identifier);

      if (region.identifier) {
        const metadata = await loadGeofenceReminderMetadata();
        const spot = metadata[region.identifier];
        await appendHistoryEvent({
          id: `${region.identifier}-${Date.now()}`,
          reminderId: region.identifier,
          spotTitle: spot?.title ?? 'Reminder',
          address: spot?.address ?? `${region.latitude.toFixed(4)}, ${region.longitude.toFixed(4)}`,
          triggeredAt: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('[Geofencing] Failed to show notification:', e);
    }
  }
});
