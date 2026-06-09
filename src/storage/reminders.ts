import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { Reminder } from '../types/reminder';

const STORAGE_KEY = '@spot_reminders_v1';

export async function loadReminders(): Promise<Reminder[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as Reminder[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
}
