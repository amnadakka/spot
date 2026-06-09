import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { HistoryEvent } from '../types/history';

const STORAGE_KEY = '@spot_history_v1';
const MAX_HISTORY_EVENTS = 100;

export async function loadHistory(): Promise<HistoryEvent[]> {
  if (Platform.OS === 'web') {
    return [];
  }

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as HistoryEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendHistoryEvent(event: HistoryEvent): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const existing = await loadHistory();
  const next = [event, ...existing].slice(0, MAX_HISTORY_EVENTS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
