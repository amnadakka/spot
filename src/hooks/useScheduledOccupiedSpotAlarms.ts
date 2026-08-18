import { useEffect, useRef } from 'react';

import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { fireGeofenceAlarmImmediate } from '../notifications/showGeofenceEnterNotification';
import { consumeDateUnlinkedRemindersAfterTrigger, shouldAutoDeleteAfterTrigger } from '../storage/consumeDateUnlinkedReminders';
import {
  ensureEnterDedupHydrated,
  recordEnterNotification,
  shouldSuppressEnterNotification,
} from '../storage/geofenceEnterDedup';
import { registerVisitEnter } from '../storage/geofenceVisitBatch';
import { appendGeofenceEnterHistory } from '../storage/history';
import { persistPendingGeofenceAlarm } from '../storage/pendingGeofenceAlarm';
import type { Reminder } from '../types/reminder';
import type { Coordinate } from '../utils/geo';
import { armNextWindowOpenAfterTrigger } from '../notifications/windowOpenAlarm';

import { useOccupiedSpotIds } from './useOccupiedSpotIds';

/**
 * Fires geofence alarms when the user is already inside a spot and the schedule
 * window opens (or the app foregrounds during an active window). Complements the
 * background geofencing task, which only runs on OS enter events.
 */
export function useScheduledOccupiedSpotAlarms(
  reminders: Reminder[],
  userLocation: Coordinate | null,
): void {
  const occupiedSpotIds = useOccupiedSpotIds(reminders, userLocation);
  const prevOccupiedRef = useRef<Set<string>>(new Set());
  const remindersRef = useRef(reminders);
  remindersRef.current = reminders;

  useEffect(() => {
    if (isExpoGoAndroid() || !userLocation) {
      prevOccupiedRef.current = new Set(occupiedSpotIds);
      return;
    }

    const prev = prevOccupiedRef.current;
    const newlyOccupied = [...occupiedSpotIds].filter((id) => !prev.has(id));
    prevOccupiedRef.current = new Set(occupiedSpotIds);

    if (newlyOccupied.length === 0) {
      return;
    }

    void (async () => {
      await ensureEnterDedupHydrated();

      const regionIds = newlyOccupied.filter((id) => !shouldSuppressEnterNotification(id));
      if (regionIds.length === 0) {
        return;
      }

      let visit = registerVisitEnter(regionIds[0]);
      for (let index = 1; index < regionIds.length; index += 1) {
        visit = registerVisitEnter(regionIds[index]);
      }

      if (!visit.shouldFireAlarm) {
        for (const id of regionIds) {
          recordEnterNotification(id);
        }
        return;
      }

      try {
        await fireGeofenceAlarmImmediate(visit.regionIds, visit.startedAt);
        await persistPendingGeofenceAlarm(visit.regionIds, visit.startedAt);
      } catch (error) {
        console.warn('[ScheduledOccupiedSpot] Alarm failed:', error);
        return;
      }

      const triggeredAt = new Date().toISOString();
      for (const id of visit.regionIds) {
        recordEnterNotification(id);

        const reminder = remindersRef.current.find((item) => item.id === id);
        if (!reminder) {
          continue;
        }

        try {
          await appendGeofenceEnterHistory({
            regionId: id,
            latitude: reminder.latitude,
            longitude: reminder.longitude,
            triggeredAt,
            spotTitle: reminder.title,
            address: reminder.address,
            description: reminder.description,
            radiusMeters: reminder.radiusMeters,
          });
        } catch (error) {
          console.warn('[ScheduledOccupiedSpot] History write failed:', error);
        }
      }

      try {
        await consumeDateUnlinkedRemindersAfterTrigger(visit.regionIds);
      } catch (error) {
        console.warn('[ScheduledOccupiedSpot] One-shot cleanup failed:', error);
      }

      try {
        const triggeredAtDate = new Date(triggeredAt);
        for (const id of visit.regionIds) {
          const reminder = remindersRef.current.find((item) => item.id === id);
          if (!reminder || shouldAutoDeleteAfterTrigger(reminder.schedule)) {
            continue;
          }
          await armNextWindowOpenAfterTrigger(reminder, triggeredAtDate);
        }
      } catch (error) {
        console.warn('[ScheduledOccupiedSpot] Next window arm failed:', error);
      }
    })();
  }, [occupiedSpotIds, userLocation]);
}
