import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus, InteractionManager } from 'react-native';

import type { ActiveGeofenceAlarm } from '../components/GeofenceAlarmRingingLayer';
import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import { getT } from '../i18n/translations';
import {
  getGeofenceReminderMetadataSync,
  loadGeofenceReminderMetadata,
} from '../storage/geofenceReminderTitles';
import {
  clearVisitBatch,
  getActiveVisitBatchSync,
  loadVisitBatch,
} from '../storage/geofenceVisitBatch';
import {
  consumeViewRegionId,
  wasAlarmDismissedNatively,
} from '../services/spotAlarmNative';
import {
  clearPendingGeofenceAlarm,
  getPendingGeofenceAlarmSync,
  loadPendingGeofenceAlarm,
} from '../storage/pendingGeofenceAlarm';

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
        title: metadata?.title ?? getT().spotAlarm,
        subtitle: metadata?.address ?? getT().enteredSpotArea,
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

  const pending = getPendingGeofenceAlarmSync();
  if (pending && pending.regionIds.length > regionIds.length) {
    return resolveAlarmFromRegionIds(pending.regionIds, pending.startedAt);
  }

  const batchStartedAt =
    typeof data.batchStartedAt === 'number'
      ? data.batchStartedAt
      : pending?.startedAt ?? batch?.startedAt;

  return resolveAlarmFromRegionIds(regionIds, batchStartedAt);
}

/**
 * Starts looping in-app alarm playback when a geofence reminder fires while the
 * JS runtime is alive. When the phone was locked or the app was backgrounded, the OS
 * notification still rings; opening or unlocking into the app restores the full-screen
 * alarm from the pending alarm record, visit batch, or notification tray.
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
  const activeAlarmRef = useRef<ActiveGeofenceAlarm | null>(null);
  activeAlarmRef.current = activeAlarm;
  const onViewSpotRef = useRef(onViewSpot);
  onViewSpotRef.current = onViewSpot;

  const startAlarm = useCallback((alarm: ActiveGeofenceAlarm) => {
    if (wasAlarmDismissedNatively(alarm.startedAt)) {
      return;
    }

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
    void clearPendingGeofenceAlarm();

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
      InteractionManager.runAfterInteractions(() => {
        void Promise.all([
          loadGeofenceReminderMetadata(),
          loadVisitBatch(),
          loadPendingGeofenceAlarm(),
        ]).then(() => {
          const pending = getPendingGeofenceAlarmSync();
          if (pending) {
            startAlarm(resolveAlarmFromRegionIds(pending.regionIds, pending.startedAt));
            return;
          }

          const batch = getActiveVisitBatchSync();
          const regionIds =
            batch && batch.regionIds.includes(regionId) ? batch.regionIds : [regionId];
          startAlarm(resolveAlarmFromRegionIds(regionIds, batch?.startedAt));
        });
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

      await Promise.all([
        loadGeofenceReminderMetadata(),
        loadVisitBatch(),
        loadPendingGeofenceAlarm(),
      ]);

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

    return () => receivedSubscription.remove();
  }, [startAlarm]);

  useEffect(() => {
    if (!activeAlarm) {
      return;
    }

    const interval = setInterval(() => {
      if (wasAlarmDismissedNatively(activeAlarm.startedAt)) {
        dismissActiveAlarm();
        return;
      }

      refreshActiveAlarmFromBatch();
    }, 2000);

    return () => clearInterval(interval);
  }, [activeAlarm, dismissActiveAlarm, refreshActiveAlarmFromBatch]);

  useEffect(() => {
    if (isExpoGoAndroid()) {
      return;
    }

    let cancelled = false;

    async function restoreAlarmFromForeground(): Promise<void> {
      if (cancelled) {
        return;
      }

      await Promise.all([
        loadGeofenceReminderMetadata(),
        loadVisitBatch(),
        loadPendingGeofenceAlarm(),
      ]);

      if (cancelled) {
        return;
      }

      const viewRegionId = consumeViewRegionId();
      const pending = getPendingGeofenceAlarmSync();
      const batch = getActiveVisitBatchSync();
      const startedAt =
        pending?.startedAt ?? batch?.startedAt ?? activeAlarmRef.current?.startedAt ?? 0;

      if (viewRegionId) {
        dismissActiveAlarm();
        const triggeredAt = new Date(startedAt || Date.now()).toISOString();
        onViewSpotRef.current(viewRegionId, { triggeredAt });
        return;
      }

      if (startedAt && wasAlarmDismissedNatively(startedAt)) {
        dismissActiveAlarm();
        return;
      }

      if (activeAlarmRef.current) {
        return;
      }

      if (pending) {
        startAlarm(resolveAlarmFromRegionIds(pending.regionIds, pending.startedAt));
        return;
      }

      if (batch) {
        startAlarm(resolveAlarmFromRegionIds(batch.regionIds, batch.startedAt));
        return;
      }

      const Notifications = require('expo-notifications') as typeof import('expo-notifications');
      const presented = await Notifications.getPresentedNotificationsAsync();

      if (cancelled || activeAlarmRef.current) {
        return;
      }

      for (const notification of presented) {
        const data = notification.request.content.data as Record<string, unknown> | undefined;
        if (!isGeofenceEnterNotification(data)) {
          continue;
        }

        const alarm = resolveAlarmFromNotificationData(data);
        if (alarm) {
          startAlarm(alarm);
          return;
        }
      }
    }

    function scheduleForegroundRestore(): void {
      InteractionManager.runAfterInteractions(() => {
        void restoreAlarmFromForeground();
      });
    }

    scheduleForegroundRestore();

    function handleAppState(nextState: AppStateStatus): void {
      if (nextState === 'active') {
        scheduleForegroundRestore();
      }
    }

    const subscription = AppState.addEventListener('change', handleAppState);

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [dismissActiveAlarm, startAlarm]);

  return {
    activeAlarm,
    dismissActiveAlarm,
    viewActiveAlarmSpot,
    startAlarmForRegion,
  };
}
