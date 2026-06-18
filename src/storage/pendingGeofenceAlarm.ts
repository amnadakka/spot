import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@spot_pending_geofence_alarm_v1';

export type PendingGeofenceAlarm = {
  startedAt: number;
  regionIds: string[];
};

let memoryPending: PendingGeofenceAlarm | null = null;
let hydrated = false;

async function hydrate(): Promise<void> {
  if (hydrated || Platform.OS === 'web') {
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PendingGeofenceAlarm;
      if (parsed?.startedAt && Array.isArray(parsed.regionIds) && parsed.regionIds.length > 0) {
        memoryPending = parsed;
      }
    }
  } catch {
    // Proceed with empty pending alarm.
  } finally {
    hydrated = true;
  }
}

void hydrate();

async function persistAsync(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  if (!memoryPending) {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryPending)).catch(() => {});
}

/** Sync read for alarm restore. Cleared only when the user dismisses the alarm. */
export function getPendingGeofenceAlarmSync(): PendingGeofenceAlarm | null {
  return memoryPending;
}

export async function loadPendingGeofenceAlarm(): Promise<PendingGeofenceAlarm | null> {
  await hydrate();
  return memoryPending;
}

/** Persists an undismissed geofence alarm until the user explicitly dismisses it. */
export async function persistPendingGeofenceAlarm(
  regionIds: string[],
  startedAt: number,
): Promise<void> {
  memoryPending = { startedAt, regionIds: [...regionIds] };
  await persistAsync();
}

export async function clearPendingGeofenceAlarm(): Promise<void> {
  memoryPending = null;
  await persistAsync();
}
