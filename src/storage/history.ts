import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { HistoryEvent } from '../types/history';
import type { Reminder } from '../types/reminder';
import { DEFAULT_REMINDER_RADIUS_METERS } from '../types/reminder';

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

/** Minimal geofence enter record — one read + one write, no reminder list loads. */
export async function appendGeofenceEnterHistory(params: {
  regionId: string;
  latitude: number;
  longitude: number;
  triggeredAt: string;
  spotTitle?: string;
  address?: string;
}): Promise<void> {
  const { regionId, latitude, longitude, triggeredAt, spotTitle, address } = params;

  await appendHistoryEvent({
    id: `${regionId}-${Date.parse(triggeredAt)}`,
    reminderId: regionId,
    spotTitle: spotTitle ?? 'Reminder',
    address: address ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    triggeredAt,
    latitude,
    longitude,
    radiusMeters: DEFAULT_REMINDER_RADIUS_METERS,
  });
}

export async function deleteHistoryEvent(eventId: string): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const existing = await loadHistory();
  const next = existing.filter((event) => event.id !== eventId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function reminderFromHistoryEvent(
  event: HistoryEvent,
  liveReminder?: Reminder,
): Reminder | null {
  if (liveReminder) {
    return liveReminder;
  }

  if (event.latitude == null || event.longitude == null) {
    return null;
  }

  return {
    id: event.reminderId,
    title: event.spotTitle,
    description: event.description,
    address: event.address,
    latitude: event.latitude,
    longitude: event.longitude,
    radiusMeters: event.radiusMeters ?? DEFAULT_REMINDER_RADIUS_METERS,
    enabled: false,
    createdAt: event.triggeredAt,
  };
}
