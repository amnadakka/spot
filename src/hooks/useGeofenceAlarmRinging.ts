import { useCallback, useEffect, useRef, useState } from 'react';

import type { ActiveGeofenceAlarm } from '../components/GeofenceAlarmRingingLayer';
import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import {
  getGeofenceReminderMetadataSync,
  loadGeofenceReminderMetadata,
} from '../storage/geofenceReminderTitles';
import {
  clearVisitBatch,
  getActiveVisitBatchSync,
  loadVisitBatch,
} from '../storage/geofenceVisitBatch';

function getRegionIdsFromGeofenceData(data: Record<string, unknown>): string[] {
  if (Array.isArray(data.regionIds)) {
    return data.regionIds.filter((id): id is string => typeof id === 'string');
  }

  if (typeof data.regionId === 'string') {
    return [data.regionId];
  }

  return [];
}

function isGeofenceEnterNotification(data: Record<string, unknown> | undefined): data is {
  type: 'geofence_enter';
  regionId: string;
} {
  return data?.type === 'geofence_enter' && typeof data.regionId === 'string';
}

function resolveAlarmFromRegionIds(regionIds: string[], startedAt?: number): ActiveGeofenceAlarm {
  const uniqueIds = [...new Set(regionIds)];

  return {
    startedAt: startedAt ?? Date.now(),
    spots: uniqueIds.map((regionId) => {
      const metadata = getGeofenceReminderMetadataSync(regionId);

      return {
        regionId,
        title: metadata?.title ?? 'Spot Alarm',
        subtitle: metadata?.address ?? 'You entered a saved spot area.',
      };
    }),
  };
}

function resolveAlarmFromNotificationData(data: Record<string, unknown>): ActiveGeofenceAlarm | null {
  const regionIds = getRegionIdsFromGeofenceData(data);
  if (regionIds.length === 0) {
    return null;
  }

  const batch = getActiveVisitBatchSync();
  if (batch && batch.regionIds.length > regionIds.length) {
    return resolveAlarmFromRegionIds(batch.regionIds, batch.startedAt);
  }

  const batchStartedAt =
    typeof data.batchStartedAt === 'number' ? data.batchStartedAt : batch?.startedAt;

  return resolveAlarmFromRegionIds(regionIds, batchStartedAt);
}

/**
 * Starts looping in-app alarm playback when a geofence reminder fires while the
 * JS runtime is alive. Background/killed state still relies on the OS notification
 * ringtone; opening the app resumes looping until the user dismisses.
 */
export function useGeofenceAlarmRinging(
  onViewSpot: (regionId: string, options?: { triggeredAt?: string | null }) => void,
): {
  activeAlarm: ActiveGeofenceAlarm | null;
  dismissActiveAlarm: () => void;
  viewActiveAlarmSpot: (regionId: string) => void;
  startAlarmForRegion: (regionId: string) => void;
} {
  const [activeAlarm, setActiveAlarm] = useState<ActiveGeofenceAlarm | null>(null);
  const onViewSpotRef = useRef(onViewSpot);
  onViewSpotRef.current = onViewSpot;

  const startAlarm = useCallback((alarm: ActiveGeofenceAlarm) => {
    setActiveAlarm(alarm);
  }, []);

  const refreshActiveAlarmFromBatch = useCallback(() => {
    const batch = getActiveVisitBatchSync();
    if (!batch) {
      return;
    }

    setActiveAlarm((current) => {
      if (!current) {
        return resolveAlarmFromRegionIds(batch.regionIds, batch.startedAt);
      }

      const currentIds = current.spots.map((spot) => spot.regionId).join(',');
      const batchIds = batch.regionIds.join(',');
      if (currentIds === batchIds) {
        return current;
      }

      return resolveAlarmFromRegionIds(batch.regionIds, batch.startedAt);
    });
  }, []);

  const dismissActiveAlarm = useCallback(() => {
    setActiveAlarm(null);
    clearVisitBatch();

    if (isExpoGoAndroid()) {
      return;
    }

    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    void Notifications.dismissAllNotificationsAsync();
  }, []);

  const viewActiveAlarmSpot = useCallback(
    (regionId: string) => {
      const triggeredAt = activeAlarm
        ? new Date(activeAlarm.startedAt).toISOString()
        : new Date().toISOString();

      dismissActiveAlarm();

      requestAnimationFrame(() => {
        onViewSpotRef.current(regionId, { triggeredAt });
      });
    },
    [activeAlarm, dismissActiveAlarm],
  );

  const startAlarmForRegion = useCallback(
    (regionId: string) => {
      void Promise.all([loadGeofenceReminderMetadata(), loadVisitBatch()]).then(() => {
        const batch = getActiveVisitBatchSync();
        const regionIds =
          batch && batch.regionIds.includes(regionId) ? batch.regionIds : [regionId];
        startAlarm(resolveAlarmFromRegionIds(regionIds, batch?.startedAt));
      });
    },
    [startAlarm],
  );

  useEffect(() => {
    if (isExpoGoAndroid()) {
      return;
    }

    const Notifications = require('expo-notifications') as typeof import('expo-notifications');

    async function handleIncomingNotification(
      notification: { request: { content: { data: Record<string, unknown> } } },
    ): Promise<void> {
      const data = notification.request.content.data;
      if (!isGeofenceEnterNotification(data)) {
        return;
      }

      await Promise.all([loadGeofenceReminderMetadata(), loadVisitBatch()]);

      const alarm = resolveAlarmFromNotificationData(data);
      if (alarm) {
        startAlarm(alarm);
      }
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification: { request: { content: { data: Record<string, unknown> } } }) => {
        void handleIncomingNotification(notification);
      },
    );

    void Promise.all([loadGeofenceReminderMetadata(), loadVisitBatch()]).then(() => {
      void Notifications.getPresentedNotificationsAsync().then((presented) => {
        const latestGeofence = presented
          .map((item) => item.request.content)
          .filter((content) => isGeofenceEnterNotification(content.data))
          .at(-1);

        if (latestGeofence && isGeofenceEnterNotification(latestGeofence.data)) {
          const alarm = resolveAlarmFromNotificationData(latestGeofence.data);
          if (alarm) {
            startAlarm(alarm);
          }
        }
      });
    });

    return () => receivedSubscription.remove();
  }, [startAlarm]);

  useEffect(() => {
    if (!activeAlarm) {
      return;
    }

    const interval = setInterval(() => {
      refreshActiveAlarmFromBatch();
    }, 2000);

    return () => clearInterval(interval);
  }, [activeAlarm, refreshActiveAlarmFromBatch]);

  return {
    activeAlarm,
    dismissActiveAlarm,
    viewActiveAlarmSpot,
    startAlarmForRegion,
  };
}
