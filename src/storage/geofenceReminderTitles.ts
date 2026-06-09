import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Reminder } from '../types/reminder';

const TITLES_KEY = '@geofence_reminder_titles_v1';
const METADATA_KEY = '@geofence_reminder_metadata_v1';

type ReminderMetadata = {
  title: string;
  address: string;
};

/** Persist id → title so the geofencing TaskManager callback can resolve labels without React state. */
export async function persistGeofenceReminderTitles(reminders: Reminder[]): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const titles = Object.fromEntries(reminders.map((r) => [r.id, r.title]));
  const metadata = Object.fromEntries(
    reminders.map((r) => [r.id, { title: r.title, address: r.address } satisfies ReminderMetadata]),
  );

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

export async function loadGeofenceReminderMetadata(): Promise<Record<string, ReminderMetadata>> {
  if (Platform.OS === 'web') {
    return {};
  }

  try {
    const raw = await AsyncStorage.getItem(METADATA_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, ReminderMetadata>;
  } catch {
    return {};
  }
}
