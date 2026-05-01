import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { persistGeofenceReminderTitles } from '../storage/geofenceReminderTitles';
import { GEOFENCING_TASK_NAME } from '../tasks/geofencingTask';
import type { Reminder } from '../types/reminder';

/**
 * Mirrors `reminders` into the OS geofencing monitor via `startGeofencingAsync`.
 * Replacing the list updates regions; an empty list stops monitoring.
 */
export async function syncReminderGeofencing(reminders: Reminder[]): Promise<void> {
  await persistGeofenceReminderTitles(reminders);

  if (Platform.OS === 'web') {
    return;
  }

  if (isExpoGoAndroid()) {
    if (reminders.length > 0) {
      console.warn(
        '[Geofencing] Expo Go on Android does not support background geofencing. Use a development build (expo.fyi/dev-client).',
      );
    }
    return;
  }

  const taskAvailable = await TaskManager.isAvailableAsync();
  if (!taskAvailable) {
    console.warn(
      '[Geofencing] TaskManager unavailable in this environment (e.g. Expo Go on Android). Use a development build for geofencing.',
    );
    return;
  }

  const background = await Location.getBackgroundPermissionsAsync();
  if (!background.granted) {
    if (reminders.length > 0) {
      console.warn(
        '[Geofencing] Background location not authorized; enable “Always” location for geofencing. Skipping region sync.',
      );
    }
    return;
  }

  try {
    if (reminders.length === 0) {
      const started = await Location.hasStartedGeofencingAsync(GEOFENCING_TASK_NAME);
      if (started) {
        await Location.stopGeofencingAsync(GEOFENCING_TASK_NAME);
      }
      return;
    }

    const regions = reminders.map((r) => ({
      identifier: r.id,
      latitude: r.latitude,
      longitude: r.longitude,
      radius: Math.max(r.radiusMeters, 1),
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

    await Location.startGeofencingAsync(GEOFENCING_TASK_NAME, regions);
  } catch (e) {
    console.warn('[Geofencing] Sync failed:', e);
  }
}
