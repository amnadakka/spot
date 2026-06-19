import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { GEOFENCE_ENTER_COOLDOWN_MS } from './geofenceEnterDedup';
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
  if (existing.some((entry) => entry.id === event.id)) {
    return;
  }

  const next = [event, ...existing].slice(0, MAX_HISTORY_EVENTS);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function hasRecentHistoryForRegion(
  events: HistoryEvent[],
  regionId: string,
  triggeredAt: string,
): boolean {
  const triggeredMs = Date.parse(triggeredAt);
  if (Number.isNaN(triggeredMs)) {
    return false;
  }

  return events.some((event) => {
    if (event.reminderId !== regionId) {
      return false;
    }

    const eventMs = Date.parse(event.triggeredAt);
    if (Number.isNaN(eventMs)) {
      return false;
    }

    return Math.abs(triggeredMs - eventMs) < GEOFENCE_ENTER_COOLDOWN_MS;
  });
}

/** Minimal geofence enter record — one read + one write, no reminder list loads. */
export async function appendGeofenceEnterHistory(params: {
  regionId: string;
  latitude: number;
  longitude: number;
  triggeredAt: string;
  spotTitle?: string;
  address?: string;
  description?: string;
  radiusMeters?: number;
}): Promise<void> {
  const {
    regionId,
    latitude,
    longitude,
    triggeredAt,
    spotTitle,
    address,
    description,
    radiusMeters,
  } = params;

  const existing = await loadHistory();
  if (hasRecentHistoryForRegion(existing, regionId, triggeredAt)) {
    return;
  }

  await appendHistoryEvent({
    id: `${regionId}-${Date.parse(triggeredAt)}`,
    reminderId: regionId,
    spotTitle: spotTitle ?? 'Reminder',
    address: address ?? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    triggeredAt,
    latitude,
    longitude,
    radiusMeters: radiusMeters ?? DEFAULT_REMINDER_RADIUS_METERS,
    description: description?.trim() || undefined,
  });
}

export async function deleteHistoryEvent(eventId: string): Promise<void> {
  await deleteHistoryEvents([eventId]);
}

export async function deleteHistoryEvents(eventIds: string[]): Promise<void> {
  if (Platform.OS === 'web' || eventIds.length === 0) {
    return;
  }

  const idSet = new Set(eventIds);
  const existing = await loadHistory();
  const next = existing.filter((event) => !idSet.has(event.id));
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
