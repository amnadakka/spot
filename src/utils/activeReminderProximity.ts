import type { Reminder } from '../types/reminder';
import { DEFAULT_REMINDER_RADIUS_METERS } from '../types/reminder';

import { distanceMeters, type Coordinate } from './geo';

export function activeSpotProximityMessage(
  conflict: Reminder,
  newRadiusMeters: number = DEFAULT_REMINDER_RADIUS_METERS,
): string {
  const minSeparation = Math.round(newRadiusMeters + conflict.radiusMeters);
  return `This location overlaps with "${conflict.title}" (${conflict.radiusMeters} m range). Pick a spot at least ${minSeparation} m away.`;
}

/** Returns the first enabled reminder whose 200 m range would overlap the given location. */
export function findConflictingActiveReminder(
  reminders: Reminder[],
  location: Coordinate,
  options?: { excludeId?: string; radiusMeters?: number },
): Reminder | undefined {
  const radiusMeters = options?.radiusMeters ?? DEFAULT_REMINDER_RADIUS_METERS;

  return reminders.find((reminder) => {
    if (!reminder.enabled) {
      return false;
    }

    if (options?.excludeId && reminder.id === options.excludeId) {
      return false;
    }

    const separation = distanceMeters(location, reminder);
    return separation < radiusMeters + reminder.radiusMeters;
  });
}
