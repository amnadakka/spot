import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@spot_geofence_visit_batch_v1';

/** Group overlapping enter events into a single alarm within this window. */
export const VISIT_COALESCE_MS = 60_000;

export type VisitBatch = {
  startedAt: number;
  regionIds: string[];
};

let memoryBatch: VisitBatch | null = null;
let hydrated = false;

async function hydrate(): Promise<void> {
  if (hydrated || Platform.OS === 'web') {
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as VisitBatch;
      if (parsed?.startedAt && Array.isArray(parsed.regionIds)) {
        memoryBatch = parsed;
      }
    }
  } catch {
    // Proceed with empty batch.
  } finally {
    hydrated = true;
  }
}

void hydrate();

function persist(): void {
  if (Platform.OS === 'web') {
    return;
  }

  if (!memoryBatch) {
    void AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    return;
  }

  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryBatch)).catch(() => {});
}

function isBatchActive(batch: VisitBatch, now = Date.now()): boolean {
  return now - batch.startedAt < VISIT_COALESCE_MS;
}

/** Sync read for the geofencing task and alarm UI. Returns null when expired. */
export function getActiveVisitBatchSync(): VisitBatch | null {
  if (!memoryBatch || !isBatchActive(memoryBatch)) {
    return null;
  }

  return memoryBatch;
}

export async function loadVisitBatch(): Promise<VisitBatch | null> {
  await hydrate();
  return getActiveVisitBatchSync();
}

/**
 * Records a region enter against the current visit batch.
 * Returns whether a new alarm should fire and the full batch of region IDs.
 */
export function registerVisitEnter(regionId: string): {
  shouldFireAlarm: boolean;
  regionIds: string[];
  startedAt: number;
} {
  const now = Date.now();
  const active = getActiveVisitBatchSync();

  if (active) {
    if (!active.regionIds.includes(regionId)) {
      active.regionIds.push(regionId);
      persist();
    }

    return {
      shouldFireAlarm: false,
      regionIds: active.regionIds,
      startedAt: active.startedAt,
    };
  }

  memoryBatch = { startedAt: now, regionIds: [regionId] };
  persist();

  return {
    shouldFireAlarm: true,
    regionIds: [regionId],
    startedAt: now,
  };
}

/** Clears the batch after the user dismisses the alarm. */
export function clearVisitBatch(): void {
  memoryBatch = null;
  persist();
}
