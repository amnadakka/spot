import { useEffect } from 'react';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { syncWindowOpenAlarms } from '../notifications/windowOpenAlarm';
import type { Reminder } from '../types/reminder';
import { isInsideRadius, type Coordinate } from '../utils/geo';

import { useScheduleMinuteTick } from './useOccupiedSpotIds';

/**
 * Arms an OS alarm at the next From time when the user is already inside a
 * closed schedule window, and cancels it when they leave or the window opens.
 */
export function useWindowOpenAlarmSync(
  reminders: Reminder[],
  userLocation: Coordinate | null,
): void {
  const scheduleMinute = useScheduleMinuteTick(reminders);

  useEffect(() => {
    if (isExpoGoAndroid()) {
      return;
    }

    const insideIds = userLocation
      ? new Set(
          reminders
            .filter(
              (reminder) =>
                reminder.enabled &&
                isInsideRadius(
                  userLocation,
                  { latitude: reminder.latitude, longitude: reminder.longitude },
                  reminder.radiusMeters,
                ),
            )
            .map((reminder) => reminder.id),
        )
      : undefined;

    void syncWindowOpenAlarms(reminders, insideIds).catch((error) => {
      console.warn('[WindowOpen] Sync failed:', error);
    });
  }, [reminders, userLocation, scheduleMinute]);
}
