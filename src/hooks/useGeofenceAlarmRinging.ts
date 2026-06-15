import { useCallback, useEffect, useRef, useState } from 'react';

import type { ActiveGeofenceAlarm } from '../components/GeofenceAlarmRingingLayer';
import { isExpoGoAndroid } from '../environment/isExpoGoAndroid';
import {
  getGeofenceReminderMetadataSync,
  loadGeofenceReminderMetadata,
} from '../storage/geofenceReminderTitles';

type GeofenceAlarmPayload = {
  regionId: string;
  title: string;
  subtitle: string;
};

function isGeofenceEnterNotification(data: Record<string, unknown> | undefined): data is {
  type: 'geofence_enter';
  regionId: string;
} {
  return data?.type === 'geofence_enter' && typeof data.regionId === 'string';
}

function resolveAlarmPayload(regionId: string): GeofenceAlarmPayload {
  const metadata = getGeofenceReminderMetadataSync(regionId);

  return {
    regionId,
    title: metadata?.title ?? 'Spot Alarm',
    subtitle: metadata?.address ?? 'You entered a saved spot area.',
  };
}

/**
 * Starts looping in-app alarm playback when a geofence reminder fires while the
 * JS runtime is alive. Background/killed state still relies on the OS notification
 * ringtone; opening the app resumes looping until the user dismisses.
 */
export function useGeofenceAlarmRinging(onViewSpot: (regionId: string) => void): {
  activeAlarm: ActiveGeofenceAlarm | null;
  dismissActiveAlarm: () => void;
  viewActiveAlarmSpot: () => void;
  startAlarmForRegion: (regionId: string) => void;
} {
  const [activeAlarm, setActiveAlarm] = useState<ActiveGeofenceAlarm | null>(null);
  const onViewSpotRef = useRef(onViewSpot);
  onViewSpotRef.current = onViewSpot;

  const startAlarm = useCallback((payload: GeofenceAlarmPayload) => {
    setActiveAlarm({
      regionId: payload.regionId,
      title: payload.title,
      subtitle: payload.subtitle,
    });
  }, []);

  const dismissActiveAlarm = useCallback(() => {
    setActiveAlarm(null);

    if (isExpoGoAndroid()) {
      return;
    }

    const Notifications = require('expo-notifications') as typeof import('expo-notifications');
    void Notifications.dismissAllNotificationsAsync();
  }, []);

  const viewActiveAlarmSpot = useCallback(() => {
    if (!activeAlarm) {
      return;
    }

    const regionId = activeAlarm.regionId;
    dismissActiveAlarm();
    onViewSpotRef.current(regionId);
  }, [activeAlarm, dismissActiveAlarm]);

  const startAlarmForRegion = useCallback((regionId: string) => {
    void loadGeofenceReminderMetadata().then(() => {
      startAlarm(resolveAlarmPayload(regionId));
    });
  }, [startAlarm]);

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

      await loadGeofenceReminderMetadata();
      startAlarm(resolveAlarmPayload(data.regionId));
    }

    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification: { request: { content: { data: Record<string, unknown> } } }) => {
        void handleIncomingNotification(notification);
      },
    );

    void Notifications.getPresentedNotificationsAsync().then((presented) => {
      const latestGeofence = presented
        .map((item) => item.request.content)
        .filter((content) => isGeofenceEnterNotification(content.data))
        .at(-1);

      if (latestGeofence && isGeofenceEnterNotification(latestGeofence.data)) {
        const regionId = latestGeofence.data.regionId;
        void loadGeofenceReminderMetadata().then(() => {
          startAlarm(resolveAlarmPayload(regionId));
        });
      }
    });

    return () => receivedSubscription.remove();
  }, [startAlarm]);

  return {
    activeAlarm,
    dismissActiveAlarm,
    viewActiveAlarmSpot,
    startAlarmForRegion,
  };
}
