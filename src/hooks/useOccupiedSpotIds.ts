import { useEffect, useMemo, useState } from 'react';

import type { Reminder } from '../types/reminder';
import { isInsideRadius, type Coordinate } from '../utils/geo';
import { hasScheduleTiming, isScheduleActiveNow } from '../utils/reminderSchedule';

/** Re-evaluate schedule windows once per minute so occupied highlighting stays accurate. */
export function useScheduleMinuteTick(reminders: Reminder[]): number {
  const [minute, setMinute] = useState(() => Math.floor(Date.now() / 60_000));

  const hasScheduledSpots = useMemo(
    () => reminders.some((reminder) => reminder.enabled && hasScheduleTiming(reminder.schedule)),
    [reminders],
  );

  useEffect(() => {
    if (!hasScheduledSpots) {
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | undefined;
    const tick = () => setMinute(Math.floor(Date.now() / 60_000));
    const msUntilNextMinute = 60_000 - (Date.now() % 60_000);
    const initialTimeout = setTimeout(() => {
      tick();
      intervalId = setInterval(tick, 60_000);
    }, msUntilNextMinute);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [hasScheduledSpots]);

  return minute;
}

/** Returns IDs of enabled spots whose geofence currently contains the user and schedule is active. */
export function useOccupiedSpotIds(
  reminders: Reminder[],
  userLocation: Coordinate | null,
): Set<string> {
  const scheduleMinute = useScheduleMinuteTick(reminders);

  return useMemo(() => {
    if (!userLocation) {
      return new Set<string>();
    }

    const occupied = new Set<string>();
    for (const reminder of reminders) {
      if (!reminder.enabled) {
        continue;
      }

      if (!isScheduleActiveNow(reminder.schedule)) {
        continue;
      }

      if (
        isInsideRadius(
          userLocation,
          { latitude: reminder.latitude, longitude: reminder.longitude },
          reminder.radiusMeters,
        )
      ) {
        occupied.add(reminder.id);
      }
    }

    return occupied;
  }, [reminders, userLocation, scheduleMinute]);
}
