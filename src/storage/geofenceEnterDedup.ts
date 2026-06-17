import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@spot_geofence_enter_dedup_v1';

/** Suppress re-enters within this window when exit events are missed (GPS bounce). */
export const GEOFENCE_ENTER_COOLDOWN_MS = 30 * 60 * 1000;

type DedupMap = Record<string, number>;

const memoryCache: DedupMap = {};
let hydrated = false;

async function hydrate(): Promise<void> {
  if (hydrated || Platform.OS === 'web') {
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DedupMap;
      if (parsed && typeof parsed === 'object') {
        Object.assign(memoryCache, parsed);
      }
    }
  } catch {
    // Proceed with empty cache.
  } finally {
    hydrated = true;
  }
}

let hydratePromise: Promise<void> | null = null;

/** Ensures persisted dedup state is loaded before checking after a cold JS start. */
export function ensureEnterDedupHydrated(): Promise<void> {
  if (hydrated) {
    return Promise.resolve();
  }

  if (!hydratePromise) {
    hydratePromise = hydrate();
  }

  return hydratePromise;
}

void ensureEnterDedupHydrated();

function persist(): void {
  if (Platform.OS === 'web') {
    return;
  }
  void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache)).catch(() => {});
}

/**
 * Returns true when a recent enter was already notified for this region.
 * Uses in-memory cache first (fast path for GPS bounce in the same task session).
 */
export function shouldSuppressEnterNotification(regionId: string): boolean {
  const last = memoryCache[regionId];
  if (!last) {
    return false;
  }
  return Date.now() - last < GEOFENCE_ENTER_COOLDOWN_MS;
}

/** Record that we notified for this region enter (call after notification fires). */
export function recordEnterNotification(regionId: string): void {
  memoryCache[regionId] = Date.now();
  persist();
}

/** Clear on geofence exit so the next physical visit can notify again. */
export function clearEnterNotification(regionId: string): void {
  delete memoryCache[regionId];
  persist();
}
