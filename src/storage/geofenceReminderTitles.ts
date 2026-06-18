import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Reminder } from '../types/reminder';

const TITLES_KEY = '@geofence_reminder_titles_v1';
const METADATA_KEY = '@geofence_reminder_metadata_v1';

export type GeofenceReminderMetadata = {
  title: string;
  address: string;
  description?: string;
};

let metadataCache: Record<string, GeofenceReminderMetadata> = {};
let hydrated = false;

async function hydrateMetadataCache(): Promise<void> {
  if (hydrated || Platform.OS === 'web') {
    return;
  }

  try {
    const raw = await AsyncStorage.getItem(METADATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, GeofenceReminderMetadata>;
      if (parsed && typeof parsed === 'object') {
        metadataCache = parsed;
      }
    }
  } catch {
    // Proceed with empty cache.
  } finally {
    hydrated = true;
  }
}

void hydrateMetadataCache();

/** Sync lookup for the background geofence task — no disk I/O on the hot path. */
export function getGeofenceReminderMetadataSync(
  regionId: string,
): GeofenceReminderMetadata | undefined {
  return metadataCache[regionId];
}

/** Persist id → title so the geofencing TaskManager callback can resolve labels without React state. */
export async function persistGeofenceReminderTitles(reminders: Reminder[]): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const titles = Object.fromEntries(reminders.map((r) => [r.id, r.title]));
  const metadata = Object.fromEntries(
    reminders.map((r) => [
      r.id,
      {
        title: r.title,
        address: r.address,
        description: r.description?.trim() || undefined,
      } satisfies GeofenceReminderMetadata,
    ]),
  );

  metadataCache = metadata;

  await AsyncStorage.multiSet([
    [TITLES_KEY, JSON.stringify(titles)],
    [METADATA_KEY, JSON.stringify(metadata)],
  ]);
}

export async function loadGeofenceReminderTitles(): Promise<Record<string, string>> {
  if (Platform.OS === 'web') {
    return {};
  }

  try {
    const raw = await AsyncStorage.getItem(TITLES_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function loadGeofenceReminderMetadata(): Promise<Record<string, GeofenceReminderMetadata>> {
  if (Platform.OS === 'web') {
    return {};
  }

  try {
    const raw = await AsyncStorage.getItem(METADATA_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw) as Record<string, GeofenceReminderMetadata>;
    metadataCache = parsed;
    hydrated = true;
    return parsed;
  } catch {
    return {};
  }
}
