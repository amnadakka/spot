import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Reminder } from '../types/reminder';

const STORAGE_KEY = '@geofence_reminder_titles_v1';

/** Persist id → title so the geofencing TaskManager callback can resolve labels without React state. */
export async function persistGeofenceReminderTitles(reminders: Reminder[]): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const map = Object.fromEntries(reminders.map((r) => [r.id, r.title]));
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export async function loadGeofenceReminderTitles(): Promise<Record<string, string>> {
  if (Platform.OS === 'web') {
    return {};
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}
