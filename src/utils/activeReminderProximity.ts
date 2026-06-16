import type { Reminder } from '../types/reminder';
import { DEFAULT_REMINDER_RADIUS_METERS } from '../types/reminder';

import { distanceMeters, type Coordinate } from './geo';

/** Returns the first enabled reminder whose range overlaps the given location. */
export function findOverlappingActiveReminder(
  reminders: Reminder[],
  location: Coordinate,
  options?: { excludeId?: string; radiusMeters?: number },
): Reminder | undefined {
  const newRadius = options?.radiusMeters ?? DEFAULT_REMINDER_RADIUS_METERS;

  return reminders.find((reminder) => {
    if (!reminder.enabled) {
      return false;
    }

    if (options?.excludeId && reminder.id === options.excludeId) {
      return false;
    }

    const separation = distanceMeters(location, reminder);
    return separation < newRadius + reminder.radiusMeters;
  });
}

export function activeSpotOverlapWarningMessage(conflict: Reminder): string {
  return `This overlaps with "${conflict.title}" (${conflict.radiusMeters} m range). When you're nearby, reminders in the same area are grouped into one alarm.`;
}
