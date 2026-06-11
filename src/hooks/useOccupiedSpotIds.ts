import { useMemo } from 'react';

import type { Reminder } from '../types/reminder';
import { isInsideRadius, type Coordinate } from '../utils/geo';

/** Returns IDs of enabled spots whose geofence currently contains the user. */
export function useOccupiedSpotIds(
  reminders: Reminder[],
  userLocation: Coordinate | null,
): Set<string> {
  return useMemo(() => {
    if (!userLocation) {
      return new Set<string>();
    }

    const occupied = new Set<string>();
    for (const reminder of reminders) {
      if (!reminder.enabled) {
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
  }, [reminders, userLocation]);
}
