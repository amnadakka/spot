/**
 * Legacy pending queue — drains stubs written before history was persisted
 * directly in the background geofence task. Safe to remove once all installs
 * have migrated (or after a few releases).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { appendGeofenceEnterHistory } from './history';
import { loadGeofenceReminderMetadata, type GeofenceReminderMetadata } from './geofenceReminderTitles';
import { loadReminders } from './reminders';

const PENDING_KEY = '@spot_pending_geofence_events_v1';

export type PendingGeofenceEvent = {
  regionId: string;
  latitude: number;
  longitude: number;
  triggeredAt: string;
};

// In-memory buffer — survives as long as the JS runtime does (background or foreground).
let memoryQueue: PendingGeofenceEvent[] = [];

/**
 * Called from the background task. Pushes to memory and persists the queue
 * so events survive a JS runtime restart.
 */
export function enqueuePendingHistoryEvent(event: PendingGeofenceEvent): void {
  memoryQueue.push(event);

  // Fire-and-forget — if this write fails, the memory queue still has the event
  // and will be drained when the foreground runs (as long as the runtime survives).
  if (Platform.OS !== 'web') {
    void AsyncStorage.setItem(PENDING_KEY, JSON.stringify(memoryQueue)).catch(() => {});
  }
}

/**
 * Called when the app enters the foreground (AppState change or mount).
 * Reads pending stubs, resolves metadata, writes full history entries,
 * then clears the queue. Safe to call multiple times (idempotent).
 */
export async function drainPendingHistory(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  // Merge memory queue with anything persisted (covers runtime restart).
  let pending: PendingGeofenceEvent[] = [...memoryQueue];

  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (raw) {
      const persisted = JSON.parse(raw) as PendingGeofenceEvent[];
      if (Array.isArray(persisted)) {
        // Deduplicate by triggeredAt + regionId
        const seen = new Set(pending.map((e) => `${e.regionId}:${e.triggeredAt}`));
        for (const p of persisted) {
          const key = `${p.regionId}:${p.triggeredAt}`;
          if (!seen.has(key)) {
            pending.push(p);
            seen.add(key);
          }
        }
      }
    }
  } catch {
    // If read fails, proceed with memory queue only.
  }

  if (pending.length === 0) {
    return;
  }

  // Clear immediately so a concurrent drain doesn't double-process.
  memoryQueue = [];
  await AsyncStorage.removeItem(PENDING_KEY).catch(() => {});

  // Now do the "heavy" work — fine because we're in the foreground.
  let metadata: Record<string, GeofenceReminderMetadata> = {};
  let remindersById: Record<string, Awaited<ReturnType<typeof loadReminders>>[number]> = {};
  try {
    metadata = await loadGeofenceReminderMetadata();
  } catch {
    // Proceed with fallback labels.
  }
  try {
    const reminders = await loadReminders();
    remindersById = Object.fromEntries(reminders.map((reminder) => [reminder.id, reminder]));
  } catch {
    // Proceed without full snapshots.
  }

  for (const stub of pending) {
    const spot = metadata[stub.regionId];
    const reminder = remindersById[stub.regionId];

    try {
      await appendGeofenceEnterHistory({
        regionId: stub.regionId,
        latitude: reminder?.latitude ?? stub.latitude,
        longitude: reminder?.longitude ?? stub.longitude,
        triggeredAt: stub.triggeredAt,
        spotTitle: reminder?.title ?? spot?.title,
        address: reminder?.address ?? spot?.address,
        description: reminder?.description ?? spot?.description,
        radiusMeters: reminder?.radiusMeters ?? spot?.radiusMeters,
      });
    } catch {
      // Individual event failure shouldn't block the rest.
    }
  }
}
